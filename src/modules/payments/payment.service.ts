import crypto from 'crypto';
import prisma from '../../config/database';
import { paystackConfig } from '../../config/paystack';
import { ApiError } from '../../utils/apiError';
import { Cache } from '../../utils/cache';
import { TicketService } from '../tickets/ticket.service';
import { NotificationService } from '../notifications/notification.service';
import { EmailService } from '../../utils/emailService';

export class PaymentService {
  static async initializePayment(userId: string, eventId: string) {
    const event = await prisma.event.findUnique({ where: { id: eventId } });

    if (!event) {
      throw ApiError.notFound('Event not found');
    }

    // Check capacity
    const ticketCount = await prisma.ticket.count({ where: { eventId } });
    if (ticketCount >= event.capacity) {
      throw ApiError.badRequest('Event is sold out');
    }

    // Check if user already has a ticket for this event
    const existingTicket = await prisma.ticket.findFirst({
      where: { userId, eventId, status: { not: 'CANCELLED' } },
    });

    if (existingTicket) {
      throw ApiError.conflict('You already have a ticket for this event');
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    const reference = `EVT-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;

    // Call Paystack to initialize
    const response = await fetch(`${paystackConfig.baseUrl}/transaction/initialize`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${paystackConfig.secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: user.email,
        amount: Math.round(event.price * 100), // Paystack uses kobo
        reference,
        callback_url: `${process.env.CLIENT_URL || 'http://localhost:5173'}/payment/callback?reference=${reference}`,
        metadata: {
          userId,
          eventId,
          eventTitle: event.title,
        },
      }),
    });

    // Paystack returns a JSON object — typed as any since it's an external API response
    const data: any = await response.json();

    if (!data.status) {
      throw ApiError.internal('Failed to initialize payment with Paystack');
    }

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        userId,
        eventId,
        amount: event.price,
        paystackReference: reference,
        paystackAccessCode: data.data.access_code,
        paystackAuthUrl: data.data.authorization_url,
      },
    });

    return {
      payment,
      authorizationUrl: data.data.authorization_url,
      accessCode: data.data.access_code,
      reference,
    };
  }

  static async verifyPayment(reference: string) {
    const payment = await prisma.payment.findUnique({
      where: { paystackReference: reference },
    });

    if (!payment) {
      throw ApiError.notFound('Payment not found');
    }

    if (payment.status === 'SUCCESS') {
      return { payment, message: 'Payment already verified' };
    }

    // Verify with Paystack
    const response = await fetch(
      `${paystackConfig.baseUrl}/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${paystackConfig.secretKey}`,
        },
      }
    );

    const data: any = await response.json();

    if (!data.status || data.data.status !== 'success') {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'FAILED' },
      });
      throw ApiError.badRequest('Payment verification failed');
    }

    // Update payment status
    const paidAtDate = data.data.paid_at ? new Date(data.data.paid_at) : new Date();
    const updatedPayment = await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'SUCCESS',
        paidAt: isNaN(paidAtDate.getTime()) ? new Date() : paidAtDate,
      },
    });

    // Create ticket with QR code
    const ticket = await TicketService.createTicket(
      payment.userId,
      payment.eventId,
      payment.id
    );

    // Auto-create default reminder if event has one
    const event = await prisma.event.findUnique({ where: { id: payment.eventId } });
    try {
      if (event && event.defaultReminderValue && event.defaultReminderUnit) {
        await NotificationService.createReminder(
          payment.userId,
          payment.eventId,
          event.defaultReminderValue,
          event.defaultReminderUnit
        );
      }
    } catch {
      // Don't fail if reminder creation fails
    }

    // Send ticket confirmation email (fire and forget)
    if (event) {
      const user = await prisma.user.findUnique({ where: { id: payment.userId }, select: { email: true, firstName: true } });
      if (user) {
        EmailService.sendTicketConfirmation(user.email, user.firstName, event, updatedPayment.amount).catch(() => {});
      }
    }

    await Cache.delPattern('analytics:*');
    await Cache.delPattern('payments:*');

    return { payment: updatedPayment, ticket };
  }

  static async handleWebhook(body: any, signature: string) {
    // Verify webhook signature
    const hash = crypto
      .createHmac('sha512', paystackConfig.secretKey)
      .update(JSON.stringify(body))
      .digest('hex');

    if (hash !== signature) {
      throw ApiError.unauthorized('Invalid webhook signature');
    }

    const { event, data } = body;

    if (event === 'charge.success') {
      const reference = data.reference;

      const payment = await prisma.payment.findUnique({
        where: { paystackReference: reference },
      });

      if (!payment || payment.status === 'SUCCESS') {
        return { message: 'Already processed' };
      }

      const paidAtDate = data.paid_at ? new Date(data.paid_at) : new Date();
      const updatedPayment = await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'SUCCESS',
          paidAt: isNaN(paidAtDate.getTime()) ? new Date() : paidAtDate,
        },
      });

      // Check if ticket already exists
      const existingTicket = await prisma.ticket.findUnique({
        where: { paymentId: payment.id },
      });

      if (!existingTicket) {
        await TicketService.createTicket(payment.userId, payment.eventId, payment.id);

        // Auto-create default reminder
        try {
          const eventData = await prisma.event.findUnique({ where: { id: payment.eventId } });
          if (eventData && eventData.defaultReminderValue && eventData.defaultReminderUnit) {
            await NotificationService.createReminder(
              payment.userId,
              payment.eventId,
              eventData.defaultReminderValue,
              eventData.defaultReminderUnit
            );
          }
        } catch {
          // Ignore reminder creation failure in webhook
        }
      }

      await Cache.delPattern('analytics:*');
      await Cache.delPattern('payments:*');

      return { message: 'Webhook processed', payment: updatedPayment };
    }

    return { message: 'Event not handled' };
  }

  static async getCreatorPayments(creatorId: string, page = 1, limit = 10) {
    const cacheKey = `payments:creator:${creatorId}:${page}:${limit}`;
    const cached = await Cache.get(cacheKey);
    if (cached) return cached;

    const creatorEvents = await prisma.event.findMany({
      where: { creatorId },
      select: { id: true },
    });

    const eventIds = creatorEvents.map((e) => e.id);

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where: { eventId: { in: eventIds } },
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          event: {
            select: { id: true, title: true },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.payment.count({ where: { eventId: { in: eventIds } } }),
    ]);

    const result = { payments, total, page, limit };
    await Cache.set(cacheKey, result, 180);

    return result;
  }

  static async getPaymentByReference(reference: string) {
    const payment = await prisma.payment.findUnique({
      where: { paystackReference: reference },
      include: {
        event: { select: { id: true, title: true, date: true, location: true } },
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
        ticket: true,
      },
    });

    if (!payment) {
      throw ApiError.notFound('Payment not found');
    }

    return payment;
  }
}
