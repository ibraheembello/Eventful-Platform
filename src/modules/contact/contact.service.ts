import prisma from '../../config/database';
import { EmailService } from '../../utils/emailService';

export class ContactService {
  static async submit(name: string, email: string, message: string) {
    const contact = await prisma.contactMessage.create({
      data: { name, email, message },
    });

    // Send notification email to admin (fire-and-forget)
    EmailService.sendContactNotification(name, email, message).catch(() => {});

    return contact;
  }

  static async getRecent(limit = 5) {
    return prisma.contactMessage.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  static async markAsRead(id: string) {
    return prisma.contactMessage.update({
      where: { id },
      data: { read: true },
    });
  }
}
