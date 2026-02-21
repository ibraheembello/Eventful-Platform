import prisma from '../../config/database';
import { ApiError } from '../../utils/apiError';
import { Cache } from '../../utils/cache';
import { EmailService } from '../../utils/emailService';
import { CreateEventInput, UpdateEventInput, CreateCommentInput } from './event.schema';
import { generateShareLinks, ShareLinks } from '../../utils/shareLink';

export class EventService {
  static async create(creatorId: string, input: CreateEventInput) {
    if (input.recurrence) {
      return this.createSeries(creatorId, input);
    }

    const { recurrence: _unused, ...eventData } = input;
    const event = await prisma.event.create({
      data: {
        ...eventData,
        date: new Date(input.date),
        creatorId,
      },
      include: {
        creator: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    await Cache.delPattern('events:*');

    return event;
  }

  private static async createSeries(creatorId: string, input: CreateEventInput) {
    const { recurrence, ...eventFields } = input;
    if (!recurrence) throw ApiError.badRequest('Recurrence is required');

    const baseDate = new Date(input.date);
    const dates: Date[] = [];

    for (let i = 0; i < recurrence.occurrences; i++) {
      const d = new Date(baseDate);
      if (recurrence.pattern === 'WEEKLY') {
        d.setDate(d.getDate() + i * 7);
      } else if (recurrence.pattern === 'BIWEEKLY') {
        d.setDate(d.getDate() + i * 14);
      } else {
        // MONTHLY — same day next month(s)
        d.setMonth(d.getMonth() + i);
      }
      dates.push(d);
    }

    const result = await prisma.$transaction(async (tx) => {
      const series = await tx.eventSeries.create({
        data: {
          title: eventFields.title,
          recurrencePattern: recurrence.pattern,
          totalOccurrences: recurrence.occurrences,
          creatorId,
        },
      });

      const events = [];
      for (let i = 0; i < dates.length; i++) {
        const event = await tx.event.create({
          data: {
            title: eventFields.title,
            description: eventFields.description,
            date: dates[i],
            location: eventFields.location,
            price: eventFields.price,
            capacity: eventFields.capacity,
            imageUrl: eventFields.imageUrl,
            category: eventFields.category,
            defaultReminderValue: eventFields.defaultReminderValue,
            defaultReminderUnit: eventFields.defaultReminderUnit,
            creatorId,
            seriesId: series.id,
            seriesOccurrence: i + 1,
          },
          include: {
            creator: {
              select: { id: true, firstName: true, lastName: true, email: true },
            },
          },
        });
        events.push(event);
      }

      return { series, events };
    });

    await Cache.delPattern('events:*');
    return result;
  }

  static async getSeriesEvents(seriesId: string, page = 1, limit = 10) {
    const series = await prisma.eventSeries.findUnique({
      where: { id: seriesId },
      include: {
        creator: { select: { id: true, firstName: true, lastName: true } },
      },
    });
    if (!series) throw ApiError.notFound('Series not found');

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where: { seriesId },
        include: {
          creator: { select: { id: true, firstName: true, lastName: true } },
          _count: { select: { tickets: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { date: 'asc' },
      }),
      prisma.event.count({ where: { seriesId } }),
    ]);

    return { series, events, total, page, limit };
  }

  static async deleteSeries(seriesId: string, creatorId: string) {
    const series = await prisma.eventSeries.findUnique({ where: { id: seriesId } });
    if (!series) throw ApiError.notFound('Series not found');
    if (series.creatorId !== creatorId) throw ApiError.forbidden('You can only delete your own series');

    // Fetch all events with active ticket holders for cancellation emails
    const seriesEvents = await prisma.event.findMany({
      where: { seriesId },
      include: {
        tickets: {
          where: { status: 'ACTIVE' },
          select: { user: { select: { email: true, firstName: true } } },
        },
      },
    });

    const result = await prisma.$transaction(async (tx) => {
      // Delete all events in the series (cascades tickets, payments, etc.)
      const deleteResult = await tx.event.deleteMany({ where: { seriesId } });
      await tx.eventSeries.delete({ where: { id: seriesId } });
      return deleteResult.count;
    });

    await Cache.delPattern('events:*');

    // Fire-and-forget cancellation emails
    let notifiedCount = 0;
    for (const event of seriesEvents) {
      for (const ticket of event.tickets) {
        notifiedCount++;
        EmailService.sendEventCancellation(
          ticket.user.email,
          ticket.user.firstName,
          event,
        ).catch(() => {});
      }
    }

    return { eventsDeleted: result, notifiedCount };
  }

  static async getAll(
    page = 1,
    limit = 10,
    search?: string,
    category?: string,
    dateFrom?: string,
    dateTo?: string,
    priceMin?: number,
    priceMax?: number,
  ) {
    const cacheKey = `events:all:${page}:${limit}:${search || ''}:${category || ''}:${dateFrom || ''}:${dateTo || ''}:${priceMin ?? ''}:${priceMax ?? ''}`;
    const cached = await Cache.get(cacheKey);
    if (cached) return cached;

    const where: any = {};

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (category) {
      where.category = { equals: category, mode: 'insensitive' };
    }

    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) where.date.gte = new Date(dateFrom);
      if (dateTo) where.date.lte = new Date(dateTo);
    }

    if (priceMin !== undefined || priceMax !== undefined) {
      where.price = {};
      if (priceMin !== undefined) where.price.gte = priceMin;
      if (priceMax !== undefined) where.price.lte = priceMax;
    }

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        include: {
          creator: {
            select: { id: true, firstName: true, lastName: true },
          },
          _count: { select: { tickets: true } },
          series: { select: { id: true, totalOccurrences: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { date: 'asc' },
      }),
      prisma.event.count({ where }),
    ]);

    const result = { events, total, page, limit };
    await Cache.set(cacheKey, result, 180);

    return result;
  }

  static async getCategories() {
    const cacheKey = 'events:categories';
    const cached = await Cache.get<string[]>(cacheKey);
    if (cached) return cached;

    const results = await prisma.event.findMany({
      where: { category: { not: null } },
      select: { category: true },
      distinct: ['category'],
      orderBy: { category: 'asc' },
    });

    const categories = results.map((r) => r.category!).filter(Boolean);
    await Cache.set(cacheKey, categories, 300);
    return categories;
  }

  static async getCategoriesWithCounts() {
    const cacheKey = 'events:categories:counts';
    const cached = await Cache.get<Array<{ category: string; count: number }>>(cacheKey);
    if (cached) return cached;

    const results = await prisma.event.groupBy({
      by: ['category'],
      _count: { id: true },
      where: { category: { not: null } },
      orderBy: { _count: { id: 'desc' } },
    });

    const categories = results.map((r) => ({
      category: r.category!,
      count: r._count.id,
    }));

    await Cache.set(cacheKey, categories, 300);
    return categories;
  }

  static async getById(id: string) {
    const cacheKey = `events:${id}`;
    const cached = await Cache.get(cacheKey);
    if (cached) return cached;

    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        creator: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        _count: { select: { tickets: true } },
        images: { orderBy: { order: 'asc' } },
        series: {
          select: { id: true, title: true, recurrencePattern: true, totalOccurrences: true },
        },
      },
    });

    if (!event) {
      throw ApiError.notFound('Event not found');
    }

    await Cache.set(cacheKey, event, 300);

    return event;
  }

  static async getCreatorEvents(creatorId: string, page = 1, limit = 10) {
    const cacheKey = `events:creator:${creatorId}:${page}:${limit}`;
    const cached = await Cache.get(cacheKey);
    if (cached) return cached;

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where: { creatorId },
        include: {
          _count: { select: { tickets: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.event.count({ where: { creatorId } }),
    ]);

    const result = { events, total, page, limit };
    await Cache.set(cacheKey, result, 180);

    return result;
  }

  static async getEventAttendees(
    eventId: string,
    creatorId: string,
    page = 1,
    limit = 10,
    search?: string,
    status?: string,
    sortBy?: string,
    sortOrder?: string,
  ) {
    const event = await prisma.event.findUnique({ where: { id: eventId } });

    if (!event) {
      throw ApiError.notFound('Event not found');
    }

    if (event.creatorId !== creatorId) {
      throw ApiError.forbidden('You can only view attendees for your own events');
    }

    const where: any = { eventId };

    if (search) {
      where.user = {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      };
    }

    if (status && ['ACTIVE', 'USED', 'CANCELLED'].includes(status)) {
      where.status = status;
    }

    let orderBy: any = { createdAt: 'desc' };
    const order = sortOrder === 'asc' ? 'asc' : 'desc';
    if (sortBy === 'name') orderBy = { user: { firstName: order } };
    else if (sortBy === 'date') orderBy = { createdAt: order };
    else if (sortBy === 'status') orderBy = { status: order };
    else if (sortBy === 'scannedAt') orderBy = { scannedAt: order };

    const [tickets, total] = await Promise.all([
      prisma.ticket.findMany({
        where,
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy,
      }),
      prisma.ticket.count({ where }),
    ]);

    // Stats
    const [totalTickets, checkedIn, cancelled] = await Promise.all([
      prisma.ticket.count({ where: { eventId } }),
      prisma.ticket.count({ where: { eventId, status: 'USED' } }),
      prisma.ticket.count({ where: { eventId, status: 'CANCELLED' } }),
    ]);

    return {
      attendees: tickets,
      total,
      page,
      limit,
      stats: {
        totalTickets,
        checkedIn,
        remaining: totalTickets - checkedIn - cancelled,
        cancelled,
      },
    };
  }

  static async manualCheckIn(ticketId: string, eventId: string, creatorId: string) {
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) throw ApiError.notFound('Event not found');
    if (event.creatorId !== creatorId) throw ApiError.forbidden('You can only check in attendees for your own events');

    const ticket = await prisma.ticket.findFirst({
      where: { id: ticketId, eventId },
    });
    if (!ticket) throw ApiError.notFound('Ticket not found');
    if (ticket.status === 'USED') throw ApiError.badRequest('Ticket already checked in');
    if (ticket.status === 'CANCELLED') throw ApiError.badRequest('Ticket is cancelled');

    const updated = await prisma.ticket.update({
      where: { id: ticketId },
      data: { status: 'USED', scannedAt: new Date() },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });

    return updated;
  }

  static async getEventeeEvents(userId: string, page = 1, limit = 10) {
    const cacheKey = `events:eventee:${userId}:${page}:${limit}`;
    const cached = await Cache.get(cacheKey);
    if (cached) return cached;

    const [tickets, total] = await Promise.all([
      prisma.ticket.findMany({
        where: { userId, status: 'ACTIVE' },
        include: {
          event: {
            include: {
              creator: {
                select: { id: true, firstName: true, lastName: true },
              },
            },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.ticket.count({ where: { userId, status: 'ACTIVE' } }),
    ]);

    const events = tickets.map((t) => t.event);
    const result = { events, total, page, limit };
    await Cache.set(cacheKey, result, 180);

    return result;
  }

  static async update(id: string, creatorId: string, input: UpdateEventInput) {
    const event = await prisma.event.findUnique({ where: { id } });

    if (!event) {
      throw ApiError.notFound('Event not found');
    }

    if (event.creatorId !== creatorId) {
      throw ApiError.forbidden('You can only update your own events');
    }

    // Detect meaningful changes for attendee notifications
    const changes: string[] = [];
    if (input.title && input.title !== event.title) {
      changes.push(`Title changed from "${event.title}" to "${input.title}"`);
    }
    if (input.date) {
      const newDate = new Date(input.date);
      if (newDate.getTime() !== event.date.getTime()) {
        const fmt = (d: Date) => d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
        changes.push(`Date changed from ${fmt(event.date)} to ${fmt(newDate)}`);
      }
    }
    if (input.location && input.location !== event.location) {
      changes.push(`Location changed from "${event.location}" to "${input.location}"`);
    }
    if (input.price !== undefined && input.price !== event.price) {
      const fmtPrice = (p: number) => p > 0 ? `NGN ${p.toLocaleString()}` : 'Free';
      changes.push(`Price changed from ${fmtPrice(event.price)} to ${fmtPrice(input.price)}`);
    }

    const updateData: any = { ...input };
    if (input.date) {
      updateData.date = new Date(input.date);
    }

    const updated = await prisma.event.update({
      where: { id },
      data: updateData,
      include: {
        creator: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    await Cache.delPattern('events:*');

    // Notify attendees if meaningful fields changed (fire and forget)
    let notifiedCount = 0;
    if (changes.length > 0) {
      notifiedCount = await prisma.ticket.count({ where: { eventId: id, status: 'ACTIVE' } });
      this.notifyAttendees(id, updated, changes).catch(() => {});
    }

    return { ...updated, notifiedCount };
  }

  private static async notifyAttendees(
    eventId: string,
    event: { title: string; date: Date; location: string; id: string },
    changes: string[],
  ) {
    const tickets = await prisma.ticket.findMany({
      where: { eventId, status: 'ACTIVE' },
      select: { user: { select: { email: true, firstName: true } } },
    });

    for (const ticket of tickets) {
      EmailService.sendEventUpdate(
        ticket.user.email,
        ticket.user.firstName,
        event,
        changes,
      ).catch(() => {});
    }
  }

  static async delete(id: string, creatorId: string) {
    const event = await prisma.event.findUnique({ where: { id } });

    if (!event) {
      throw ApiError.notFound('Event not found');
    }

    if (event.creatorId !== creatorId) {
      throw ApiError.forbidden('You can only delete your own events');
    }

    // Fetch active ticket holders before deletion for cancellation emails
    const tickets = await prisma.ticket.findMany({
      where: { eventId: id, status: 'ACTIVE' },
      select: { user: { select: { email: true, firstName: true } } },
    });

    await prisma.event.delete({ where: { id } });
    await Cache.delPattern('events:*');

    // Fire-and-forget cancellation emails
    const notifiedCount = tickets.length;
    if (notifiedCount > 0) {
      for (const ticket of tickets) {
        EmailService.sendEventCancellation(
          ticket.user.email,
          ticket.user.firstName,
          event,
        ).catch(() => {});
      }
    }

    return { message: 'Event deleted successfully', notifiedCount };
  }

  static async toggleBookmark(userId: string, eventId: string) {
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) {
      throw ApiError.notFound('Event not found');
    }

    const existing = await prisma.bookmark.findUnique({
      where: { userId_eventId: { userId, eventId } },
    });

    if (existing) {
      await prisma.bookmark.delete({ where: { id: existing.id } });
      return { bookmarked: false };
    }

    await prisma.bookmark.create({ data: { userId, eventId } });
    return { bookmarked: true };
  }

  static async getBookmarkedEvents(userId: string, page = 1, limit = 10) {
    const [bookmarks, total] = await Promise.all([
      prisma.bookmark.findMany({
        where: { userId },
        include: {
          event: {
            include: {
              creator: {
                select: { id: true, firstName: true, lastName: true },
              },
              _count: { select: { tickets: true } },
            },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.bookmark.count({ where: { userId } }),
    ]);

    const events = bookmarks.map((b) => b.event);
    return { events, total, page, limit };
  }

  static async getBookmarkIds(userId: string) {
    const bookmarks = await prisma.bookmark.findMany({
      where: { userId },
      select: { eventId: true },
    });
    return bookmarks.map((b) => b.eventId);
  }

  static async joinWaitlist(userId: string, eventId: string) {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: { _count: { select: { tickets: true } } },
    });
    if (!event) throw ApiError.notFound('Event not found');

    const ticketsSold = event._count.tickets;
    if (ticketsSold < event.capacity) {
      throw ApiError.badRequest('Event is not sold out — you can still buy a ticket');
    }

    const existing = await prisma.waitlist.findUnique({
      where: { userId_eventId: { userId, eventId } },
    });
    if (existing) {
      throw ApiError.badRequest('You are already on the waitlist');
    }

    // Get the next position
    const lastEntry = await prisma.waitlist.findFirst({
      where: { eventId },
      orderBy: { position: 'desc' },
    });
    const position = (lastEntry?.position || 0) + 1;

    const entry = await prisma.waitlist.create({
      data: { userId, eventId, position },
    });

    return { ...entry, totalAhead: position - 1 };
  }

  static async leaveWaitlist(userId: string, eventId: string) {
    const existing = await prisma.waitlist.findUnique({
      where: { userId_eventId: { userId, eventId } },
    });
    if (!existing) {
      throw ApiError.notFound('You are not on the waitlist');
    }

    await prisma.waitlist.delete({ where: { id: existing.id } });

    // Re-order positions for remaining entries
    const remaining = await prisma.waitlist.findMany({
      where: { eventId },
      orderBy: { position: 'asc' },
    });
    await Promise.all(
      remaining.map((entry, index) =>
        prisma.waitlist.update({
          where: { id: entry.id },
          data: { position: index + 1 },
        })
      )
    );

    return { removed: true };
  }

  static async getWaitlistStatus(userId: string, eventId: string) {
    const entry = await prisma.waitlist.findUnique({
      where: { userId_eventId: { userId, eventId } },
    });
    if (!entry) return { onWaitlist: false, position: null, total: 0 };

    const total = await prisma.waitlist.count({ where: { eventId } });
    return { onWaitlist: true, position: entry.position, total };
  }

  static async getUserWaitlists(userId: string, page = 1, limit = 10) {
    const [entries, total] = await Promise.all([
      prisma.waitlist.findMany({
        where: { userId },
        include: {
          event: {
            include: {
              creator: { select: { id: true, firstName: true, lastName: true } },
              _count: { select: { tickets: true } },
            },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.waitlist.count({ where: { userId } }),
    ]);

    return { entries, total, page, limit };
  }

  static async createComment(userId: string, eventId: string, input: CreateCommentInput) {
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) throw ApiError.notFound('Event not found');

    // Event must be in the past
    if (new Date(event.date) > new Date()) {
      throw ApiError.badRequest('You can only review events that have already happened');
    }

    // User must have a ticket for this event
    const ticket = await prisma.ticket.findFirst({
      where: { userId, eventId },
    });
    if (!ticket) {
      throw ApiError.forbidden('You must have a ticket to review this event');
    }

    // One review per user per event
    const existing = await prisma.comment.findUnique({
      where: { userId_eventId: { userId, eventId } },
    });
    if (existing) {
      throw ApiError.badRequest('You have already reviewed this event');
    }

    const comment = await prisma.comment.create({
      data: { userId, eventId, content: input.content, rating: input.rating },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, profileImage: true } },
      },
    });

    return comment;
  }

  static async getComments(eventId: string, page = 1, limit = 10) {
    const [comments, total, avgResult] = await Promise.all([
      prisma.comment.findMany({
        where: { eventId },
        include: {
          user: { select: { id: true, firstName: true, lastName: true, profileImage: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.comment.count({ where: { eventId } }),
      prisma.comment.aggregate({
        where: { eventId },
        _avg: { rating: true },
      }),
    ]);

    return {
      comments,
      total,
      page,
      limit,
      averageRating: avgResult._avg.rating || 0,
    };
  }

  static async deleteComment(commentId: string, eventId: string, userId: string) {
    const comment = await prisma.comment.findFirst({
      where: { id: commentId, eventId },
    });
    if (!comment) throw ApiError.notFound('Comment not found');

    // Only the author or the event creator can delete
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (comment.userId !== userId && event?.creatorId !== userId) {
      throw ApiError.forbidden('You can only delete your own reviews');
    }

    await prisma.comment.delete({ where: { id: commentId } });
    return { deleted: true };
  }

  static async addEventImage(eventId: string, creatorId: string, url: string, caption?: string) {
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) throw ApiError.notFound('Event not found');
    if (event.creatorId !== creatorId) throw ApiError.forbidden('You can only add images to your own events');

    const lastImage = await prisma.eventImage.findFirst({
      where: { eventId },
      orderBy: { order: 'desc' },
    });
    const order = (lastImage?.order ?? -1) + 1;

    const image = await prisma.eventImage.create({
      data: { eventId, url, caption, order },
    });

    await Cache.delPattern(`events:${eventId}`);
    return image;
  }

  static async removeEventImage(imageId: string, eventId: string, creatorId: string) {
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) throw ApiError.notFound('Event not found');
    if (event.creatorId !== creatorId) throw ApiError.forbidden('You can only remove images from your own events');

    const image = await prisma.eventImage.findFirst({
      where: { id: imageId, eventId },
    });
    if (!image) throw ApiError.notFound('Image not found');

    await prisma.eventImage.delete({ where: { id: imageId } });
    await Cache.delPattern(`events:${eventId}`);
    return { deleted: true };
  }

  static async getEventImages(eventId: string) {
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) throw ApiError.notFound('Event not found');

    return prisma.eventImage.findMany({
      where: { eventId },
      orderBy: { order: 'asc' },
    });
  }

  static async reorderImages(eventId: string, creatorId: string, imageIds: string[]) {
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) throw ApiError.notFound('Event not found');
    if (event.creatorId !== creatorId) throw ApiError.forbidden('You can only reorder images for your own events');

    // Validate all IDs belong to this event
    const images = await prisma.eventImage.findMany({ where: { eventId } });
    const existingIds = new Set(images.map((img) => img.id));
    for (const id of imageIds) {
      if (!existingIds.has(id)) throw ApiError.badRequest(`Image ${id} does not belong to this event`);
    }

    // Update order by array index
    await Promise.all(
      imageIds.map((id, index) =>
        prisma.eventImage.update({ where: { id }, data: { order: index } })
      )
    );

    await Cache.delPattern(`events:${eventId}`);
    return prisma.eventImage.findMany({ where: { eventId }, orderBy: { order: 'asc' } });
  }

  static async updateImage(imageId: string, eventId: string, creatorId: string, caption?: string | null) {
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) throw ApiError.notFound('Event not found');
    if (event.creatorId !== creatorId) throw ApiError.forbidden('You can only update images for your own events');

    const image = await prisma.eventImage.findFirst({ where: { id: imageId, eventId } });
    if (!image) throw ApiError.notFound('Image not found');

    const updated = await prisma.eventImage.update({
      where: { id: imageId },
      data: { caption: caption ?? null },
    });

    await Cache.delPattern(`events:${eventId}`);
    return updated;
  }

  static async getShareLinks(eventId: string): Promise<ShareLinks> {
    const event = await prisma.event.findUnique({ where: { id: eventId } });

    if (!event) {
      throw ApiError.notFound('Event not found');
    }

    const eventUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/events/${eventId}`;
    return generateShareLinks(event.title, eventUrl, event.description);
  }
}
