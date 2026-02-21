import prisma from '../../config/database';
import { ApiError } from '../../utils/apiError';

export class AdminService {
  static async getStats() {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      totalEvents,
      totalTickets,
      totalRevenue,
      usersByRole,
      recentUsers,
      recentEvents,
      recentTickets,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.event.count(),
      prisma.ticket.count(),
      prisma.payment.aggregate({ where: { status: 'SUCCESS' }, _sum: { amount: true } }),
      prisma.user.groupBy({ by: ['role'], _count: { id: true } }),
      prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      prisma.event.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      prisma.ticket.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    ]);

    return {
      totalUsers,
      totalEvents,
      totalTickets,
      totalRevenue: totalRevenue._sum.amount || 0,
      usersByRole: usersByRole.map((r) => ({ role: r.role, count: r._count.id })),
      last30Days: {
        users: recentUsers,
        events: recentEvents,
        tickets: recentTickets,
      },
    };
  }

  static async getUsers(page = 1, limit = 20, search?: string, role?: string) {
    const where: any = {};

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (role) {
      where.role = role;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          provider: true,
          suspended: true,
          profileImage: true,
          createdAt: true,
          _count: { select: { events: true, tickets: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    return { users, total, page, limit };
  }

  static async changeUserRole(userId: string, role: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw ApiError.notFound('User not found');

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { role: role as any },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        suspended: true,
      },
    });

    return updated;
  }

  static async toggleSuspend(userId: string, suspended: boolean) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw ApiError.notFound('User not found');

    if (user.role === 'ADMIN') {
      throw ApiError.badRequest('Cannot suspend an admin user');
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { suspended },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        suspended: true,
      },
    });

    return updated;
  }

  static async getEvents(page = 1, limit = 20, search?: string) {
    const where: any = {};

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        include: {
          creator: { select: { id: true, firstName: true, lastName: true, email: true } },
          _count: { select: { tickets: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.event.count({ where }),
    ]);

    return { events, total, page, limit };
  }

  static async deleteEvent(eventId: string) {
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) throw ApiError.notFound('Event not found');

    await prisma.event.delete({ where: { id: eventId } });
    return { deleted: true };
  }

  static async getPayments(page = 1, limit = 20) {
    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        include: {
          user: { select: { id: true, firstName: true, lastName: true, email: true } },
          event: { select: { id: true, title: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.payment.count(),
    ]);

    return { payments, total, page, limit };
  }
}
