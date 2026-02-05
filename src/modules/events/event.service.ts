import prisma from '../../config/database';
import { ApiError } from '../../utils/apiError';
import { Cache } from '../../utils/cache';
import { CreateEventInput, UpdateEventInput } from './event.schema';
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

  static async getAll(page = 1, limit = 10, search?: string, category?: string) {
    const cacheKey = `events:all:${page}:${limit}:${search || ''}:${category || ''}`;
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

  static async getEventAttendees(eventId: string, creatorId: string, page = 1, limit = 10) {
    const event = await prisma.event.findUnique({ where: { id: eventId } });

    if (!event) {
      throw ApiError.notFound('Event not found');
    }

    if (event.creatorId !== creatorId) {
      throw ApiError.forbidden('You can only view attendees for your own events');
    }

    const [tickets, total] = await Promise.all([
      prisma.ticket.findMany({
        where: { eventId },
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.ticket.count({ where: { eventId } }),
    ]);

    return { attendees: tickets, total, page, limit };
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

  static async getShareLinks(eventId: string): Promise<ShareLinks> {
    const event = await prisma.event.findUnique({ where: { id: eventId } });

    if (!event) {
      throw ApiError.notFound('Event not found');
    }

    const eventUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/events/${eventId}`;
    return generateShareLinks(event.title, eventUrl, event.description);
  }
}
