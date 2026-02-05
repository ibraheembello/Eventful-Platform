import prisma from '../../config/database';
import { ReminderUnit } from '@prisma/client';
import { ApiError } from '../../utils/apiError';

export class NotificationService {
  static calculateReminderTime(eventDate: Date, value: number, unit: ReminderUnit): Date {
    const reminderTime = new Date(eventDate);

    switch (unit) {
      case 'MINUTES':
        reminderTime.setMinutes(reminderTime.getMinutes() - value);
        break;
      case 'HOURS':
        reminderTime.setHours(reminderTime.getHours() - value);
        break;
      case 'DAYS':
        reminderTime.setDate(reminderTime.getDate() - value);
        break;
      case 'WEEKS':
        reminderTime.setDate(reminderTime.getDate() - value * 7);
        break;
    }

    return reminderTime;
  }

  static async createReminder(
    userId: string,
    eventId: string,
    reminderValue: number,
    reminderUnit: ReminderUnit
  ) {
    const event = await prisma.event.findUnique({ where: { id: eventId } });

    if (!event) {
      throw ApiError.notFound('Event not found');
    }

    const reminderTime = this.calculateReminderTime(event.date, reminderValue, reminderUnit);

    if (reminderTime <= new Date()) {
      throw ApiError.badRequest('Reminder time must be in the future');
    }

    // Check for duplicate reminder
    const existing = await prisma.notification.findFirst({
      where: {
        userId,
        eventId,
        reminderValue,
        reminderUnit,
      },
    });

    if (existing) {
      throw ApiError.conflict('You already have this reminder set');
    }

    const notification = await prisma.notification.create({
      data: {
        userId,
        eventId,
        reminderValue,
        reminderUnit,
        reminderTime,
        message: `Reminder: "${event.title}" is happening in ${reminderValue} ${reminderUnit.toLowerCase()}!`,
      },
      include: {
        event: { select: { id: true, title: true, date: true, location: true } },
      },
    });

    return notification;
  }

  static async getUserReminders(userId: string, page = 1, limit = 10) {
    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        include: {
          event: { select: { id: true, title: true, date: true, location: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { reminderTime: 'asc' },
      }),
      prisma.notification.count({ where: { userId } }),
    ]);

    return { notifications, total, page, limit };
  }

  static async updateReminder(
    reminderId: string,
    userId: string,
    reminderValue?: number,
    reminderUnit?: ReminderUnit
  ) {
    const notification = await prisma.notification.findUnique({
      where: { id: reminderId },
      include: { event: true },
    });

    if (!notification) {
      throw ApiError.notFound('Reminder not found');
    }

    if (notification.userId !== userId) {
      throw ApiError.forbidden('You can only update your own reminders');
    }

    const newValue = reminderValue || notification.reminderValue;
    const newUnit = reminderUnit || notification.reminderUnit;

    const reminderTime = this.calculateReminderTime(notification.event.date, newValue, newUnit);

    if (reminderTime <= new Date()) {
      throw ApiError.badRequest('Reminder time must be in the future');
    }

    const updated = await prisma.notification.update({
      where: { id: reminderId },
      data: {
        reminderValue: newValue,
        reminderUnit: newUnit,
        reminderTime,
        message: `Reminder: "${notification.event.title}" is happening in ${newValue} ${newUnit.toLowerCase()}!`,
        sent: false,
      },
      include: {
        event: { select: { id: true, title: true, date: true, location: true } },
      },
    });

    return updated;
  }

  static async deleteReminder(reminderId: string, userId: string) {
    const notification = await prisma.notification.findUnique({
      where: { id: reminderId },
    });

    if (!notification) {
      throw ApiError.notFound('Reminder not found');
    }

    if (notification.userId !== userId) {
      throw ApiError.forbidden('You can only delete your own reminders');
    }

    await prisma.notification.delete({ where: { id: reminderId } });

    return { message: 'Reminder deleted successfully' };
  }

  static async getDueReminders() {
    const now = new Date();

    return prisma.notification.findMany({
      where: {
        sent: false,
        reminderTime: { lte: now },
      },
      include: {
        user: { select: { id: true, firstName: true, email: true } },
        event: { select: { id: true, title: true, date: true, location: true } },
      },
    });
  }

  static async markAsSent(notificationId: string) {
    return prisma.notification.update({
      where: { id: notificationId },
      data: { sent: true },
    });
  }
}
