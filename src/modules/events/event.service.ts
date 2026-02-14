import prisma from '../../config/database';
import { ApiError } from '../../utils/apiError';
import { Cache } from '../../utils/cache';
import { CreateEventInput, UpdateEventInput, CreateCommentInput } from './event.schema';
import { generateShareLinks, ShareLinks } from '../../utils/shareLink';

export class EventService {
  static async create(creatorId: string, input: CreateEventInput) {
    const event = await prisma.event.create({
      data: {
        ...input,
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

    return updated;
  }

  static async delete(id: string, creatorId: string) {
    const event = await prisma.event.findUnique({ where: { id } });

    if (!event) {
      throw ApiError.notFound('Event not found');
    }

    if (event.creatorId !== creatorId) {
      throw ApiError.forbidden('You can only delete your own events');
    }

    await prisma.event.delete({ where: { id } });
    await Cache.delPattern('events:*');

    return { message: 'Event deleted successfully' };
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

  static async getShareLinks(eventId: string): Promise<ShareLinks> {
    const event = await prisma.event.findUnique({ where: { id: eventId } });

    if (!event) {
      throw ApiError.notFound('Event not found');
    }

    const eventUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/events/${eventId}`;
    return generateShareLinks(event.title, eventUrl, event.description);
  }
}
