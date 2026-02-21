import prisma from '../../config/database';

export class InAppNotificationService {
  static async create(userId: string, message: string, type: string, link?: string) {
    return prisma.inAppNotification.create({
      data: { userId, message, type, link },
    });
  }

  static async createBulk(
    userIds: string[],
    message: string,
    type: string,
    link?: string,
  ) {
    if (userIds.length === 0) return;
    await prisma.inAppNotification.createMany({
      data: userIds.map((userId) => ({ userId, message, type, link })),
    });
  }

  static async getForUser(userId: string, page = 1, limit = 20) {
    const [notifications, total] = await Promise.all([
      prisma.inAppNotification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.inAppNotification.count({ where: { userId } }),
    ]);
    return { notifications, total, page, limit };
  }

  static async getUnreadCount(userId: string) {
    return prisma.inAppNotification.count({
      where: { userId, read: false },
    });
  }

  static async markAsRead(id: string, userId: string) {
    const notif = await prisma.inAppNotification.findFirst({
      where: { id, userId },
    });
    if (!notif) return null;
    return prisma.inAppNotification.update({
      where: { id },
      data: { read: true },
    });
  }

  static async markAllAsRead(userId: string) {
    const result = await prisma.inAppNotification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
    return result.count;
  }
}
