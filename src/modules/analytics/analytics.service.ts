import prisma from '../../config/database';
import { ApiError } from '../../utils/apiError';
import { Cache } from '../../utils/cache';

export class AnalyticsService {
  static async getCreatorOverview(creatorId: string) {
    const cacheKey = `analytics:overview:${creatorId}`;
    const cached = await Cache.get(cacheKey);
    if (cached) return cached;

    const creatorEvents = await prisma.event.findMany({
      where: { creatorId },
      select: { id: true },
    });

    const eventIds = creatorEvents.map((e) => e.id);

    const [totalAttendees, totalTicketsSold, totalTicketsScanned, totalRevenue] =
      await Promise.all([
        prisma.ticket.count({
          where: { eventId: { in: eventIds }, status: 'USED' },
        }),
        prisma.ticket.count({
          where: { eventId: { in: eventIds } },
        }),
        prisma.ticket.count({
          where: { eventId: { in: eventIds }, status: 'USED' },
        }),
        prisma.payment.aggregate({
          where: { eventId: { in: eventIds }, status: 'SUCCESS' },
          _sum: { amount: true },
        }),
      ]);

    const result = {
      totalEvents: eventIds.length,
      totalAttendees,
      totalTicketsSold,
      totalTicketsScanned,
      totalRevenue: totalRevenue._sum.amount || 0,
    };

    await Cache.set(cacheKey, result, 300);

    return result;
  }

  static async getEventAnalytics(eventId: string, creatorId: string) {
    const cacheKey = `analytics:event:${eventId}`;
    const cached = await Cache.get(cacheKey);
    if (cached) return cached;

    const event = await prisma.event.findUnique({ where: { id: eventId } });

    if (!event) {
      throw ApiError.notFound('Event not found');
    }

    if (event.creatorId !== creatorId) {
      throw ApiError.forbidden('You can only view analytics for your own events');
    }

    const [ticketsSold, ticketsScanned, ticketsActive, revenue] = await Promise.all([
      prisma.ticket.count({ where: { eventId } }),
      prisma.ticket.count({ where: { eventId, status: 'USED' } }),
      prisma.ticket.count({ where: { eventId, status: 'ACTIVE' } }),
      prisma.payment.aggregate({
        where: { eventId, status: 'SUCCESS' },
        _sum: { amount: true },
      }),
    ]);

    const result = {
      event: {
        id: event.id,
        title: event.title,
        date: event.date,
        capacity: event.capacity,
      },
      ticketsSold,
      ticketsScanned,
      ticketsActive,
      ticketsCancelled: await prisma.ticket.count({
        where: { eventId, status: 'CANCELLED' },
      }),
      capacityUsed: `${((ticketsSold / event.capacity) * 100).toFixed(1)}%`,
      revenue: revenue._sum.amount || 0,
    };

    await Cache.set(cacheKey, result, 300);

    return result;
  }

  static async getCreatorEventsAnalytics(creatorId: string) {
    const cacheKey = `analytics:events-list:${creatorId}`;
    const cached = await Cache.get(cacheKey);
    if (cached) return cached;

    const events = await prisma.event.findMany({
      where: { creatorId },
      select: {
        id: true,
        title: true,
        date: true,
        capacity: true,
        price: true,
        _count: {
          select: { tickets: true, payments: true },
        },
      },
      orderBy: { date: 'desc' },
    });

    const eventsWithAnalytics = await Promise.all(
      events.map(async (event) => {
        const [scanned, revenue] = await Promise.all([
          prisma.ticket.count({ where: { eventId: event.id, status: 'USED' } }),
          prisma.payment.aggregate({
            where: { eventId: event.id, status: 'SUCCESS' },
            _sum: { amount: true },
          }),
        ]);

        return {
          id: event.id,
          title: event.title,
          date: event.date,
          capacity: event.capacity,
          ticketsSold: event._count.tickets,
          ticketsScanned: scanned,
          revenue: revenue._sum.amount || 0,
        };
      })
    );

    await Cache.set(cacheKey, eventsWithAnalytics, 300);

    return eventsWithAnalytics;
  }
}
