import prisma from '../../config/database';

export class DashboardService {
  static async getUserDashboard(userId: string, role: string) {
    const now = new Date();

    // Common: ticket stats
    const [totalTickets, upcomingTickets, attendedTickets] = await Promise.all([
      prisma.ticket.count({ where: { userId } }),
      prisma.ticket.count({
        where: { userId, status: 'ACTIVE', event: { date: { gte: now } } },
      }),
      prisma.ticket.count({ where: { userId, status: 'USED' } }),
    ]);

    // Upcoming events (next 6 events the user has tickets for)
    const upcomingEvents = await prisma.ticket.findMany({
      where: { userId, status: 'ACTIVE', event: { date: { gte: now } } },
      include: {
        event: {
          include: {
            creator: { select: { id: true, firstName: true, lastName: true } },
            _count: { select: { tickets: true } },
          },
        },
      },
      orderBy: { event: { date: 'asc' } },
      take: 6,
    });

    // Recent notifications (last 5)
    const recentNotifications = await prisma.inAppNotification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    const base = {
      ticketStats: { total: totalTickets, upcoming: upcomingTickets, attended: attendedTickets },
      upcomingEvents: upcomingEvents.map((t) => t.event),
      recentNotifications,
    };

    if (role === 'CREATOR') {
      const [createdEvents, revenueResult, recentSales] = await Promise.all([
        prisma.event.count({ where: { creatorId: userId } }),
        prisma.payment.aggregate({
          where: { event: { creatorId: userId }, status: 'SUCCESS' },
          _sum: { amount: true },
        }),
        prisma.payment.findMany({
          where: { event: { creatorId: userId }, status: 'SUCCESS' },
          include: {
            user: { select: { firstName: true, lastName: true } },
            event: { select: { title: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
        }),
      ]);

      return {
        ...base,
        creatorStats: {
          createdEvents,
          totalRevenue: revenueResult._sum.amount || 0,
        },
        recentSales,
      };
    }

    // EVENTEE extras
    const [savedCount, waitlistCount] = await Promise.all([
      prisma.bookmark.count({ where: { userId } }),
      prisma.waitlist.count({ where: { userId } }),
    ]);

    return {
      ...base,
      eventeeStats: {
        savedEvents: savedCount,
        waitlists: waitlistCount,
      },
    };
  }
}
