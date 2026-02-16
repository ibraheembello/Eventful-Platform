import prisma from '../../config/database';
import { ApiError } from '../../utils/apiError';
import { Cache } from '../../utils/cache';
import { EmailService } from '../../utils/emailService';
import { QRCodeService } from '../qrcode/qrcode.service';

export class TicketService {
  static async createTicket(userId: string, eventId: string, paymentId: string) {
    const qrData = await QRCodeService.generateQRCode('pending', eventId, userId);

    const ticket = await prisma.ticket.create({
      data: {
        userId,
        eventId,
        paymentId,
        qrCode: qrData.qrCode,
        qrCodeData: qrData.token,
      },
      include: {
        event: {
          select: { id: true, title: true, date: true, location: true },
        },
        user: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    // Regenerate QR with actual ticket ID
    const finalQR = await QRCodeService.generateQRCode(ticket.id, eventId, userId);
    await prisma.ticket.update({
      where: { id: ticket.id },
      data: { qrCode: finalQR.qrCode, qrCodeData: finalQR.token },
    });

    await Cache.delPattern(`events:eventee:${userId}:*`);

    return { ...ticket, qrCode: finalQR.qrCode, qrCodeDataUrl: finalQR.qrCodeData };
  }

  static async getUserTickets(userId: string, page = 1, limit = 10) {
    const cacheKey = `tickets:user:${userId}:${page}:${limit}`;
    const cached = await Cache.get(cacheKey);
    if (cached) return cached;

    const [tickets, total] = await Promise.all([
      prisma.ticket.findMany({
        where: { userId },
        include: {
          event: {
            select: {
              id: true,
              title: true,
              date: true,
              location: true,
              imageUrl: true,
              creator: {
                select: { firstName: true, lastName: true },
              },
            },
          },
          payment: {
            select: { amount: true, status: true },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.ticket.count({ where: { userId } }),
    ]);

    const result = { tickets, total, page, limit };
    await Cache.set(cacheKey, result, 180);

    return result;
  }

  static async getTicketById(ticketId: string, userId: string) {
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        event: {
          include: {
            creator: {
              select: { id: true, firstName: true, lastName: true },
            },
          },
        },
        user: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        payment: true,
      },
    });

    if (!ticket) {
      throw ApiError.notFound('Ticket not found');
    }

    if (ticket.userId !== userId && ticket.event.creatorId !== userId) {
      throw ApiError.forbidden('You do not have access to this ticket');
    }

    return ticket;
  }

  static async verifyTicket(qrToken: string, creatorId: string) {
    let decoded;
    try {
      decoded = QRCodeService.verifyQRToken(qrToken);
    } catch {
      throw ApiError.badRequest('Invalid QR code');
    }

    const ticket = await prisma.ticket.findFirst({
      where: { id: decoded.ticketId },
      include: {
        event: true,
        user: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    if (!ticket) {
      throw ApiError.notFound('Ticket not found');
    }

    if (ticket.event.creatorId !== creatorId) {
      throw ApiError.forbidden('You can only verify tickets for your own events');
    }

    if (ticket.status === 'USED') {
      throw ApiError.badRequest('This ticket has already been used');
    }

    if (ticket.status === 'CANCELLED') {
      throw ApiError.badRequest('This ticket has been cancelled');
    }

    const updatedTicket = await prisma.ticket.update({
      where: { id: ticket.id },
      data: {
        status: 'USED',
        scannedAt: new Date(),
      },
      include: {
        event: { select: { id: true, title: true, date: true } },
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });

    return updatedTicket;
  }

  static async cancelTicket(ticketId: string, userId: string) {
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        event: {
          select: { id: true, title: true, date: true, location: true },
        },
      },
    });

    if (!ticket) {
      throw ApiError.notFound('Ticket not found');
    }

    if (ticket.userId !== userId) {
      throw ApiError.forbidden('You can only cancel your own tickets');
    }

    if (ticket.status !== 'ACTIVE') {
      throw ApiError.badRequest(`Cannot cancel a ticket that is ${ticket.status.toLowerCase()}`);
    }

    const cancelled = await prisma.ticket.update({
      where: { id: ticketId },
      data: { status: 'CANCELLED' },
      include: {
        event: {
          select: { id: true, title: true, date: true, location: true },
        },
      },
    });

    // Clear caches
    await Promise.all([
      Cache.delPattern(`tickets:user:${userId}:*`),
      Cache.delPattern(`events:*`),
      Cache.delPattern(`analytics:*`),
    ]);

    // Notify first waitlisted user (fire and forget)
    this.notifyNextWaitlistUser(ticket.event.id, ticket.event.title).catch(() => {});

    return cancelled;
  }

  private static async notifyNextWaitlistUser(eventId: string, eventTitle: string) {
    const nextEntry = await prisma.waitlist.findFirst({
      where: { eventId, notified: false },
      orderBy: { position: 'asc' },
      include: {
        user: { select: { email: true, firstName: true } },
      },
    });

    if (!nextEntry) return;

    await prisma.waitlist.update({
      where: { id: nextEntry.id },
      data: { notified: true },
    });

    // Send email notification
    await EmailService.sendWaitlistNotification(
      nextEntry.user.email,
      nextEntry.user.firstName,
      { title: eventTitle, id: eventId },
    );
  }
}
