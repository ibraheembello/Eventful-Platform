import crypto from 'crypto';
import prisma from '../../config/database';
import { paystackConfig } from '../../config/paystack';
import { ApiError } from '../../utils/apiError';
import { Cache } from '../../utils/cache';
import { TicketService } from '../tickets/ticket.service';
import { NotificationService } from '../notifications/notification.service';
import { EmailService } from '../../utils/emailService';
import { InAppNotificationService } from '../inAppNotifications/in-app-notification.service';

export class PaymentService {
  static async initializePayment(userId: string, eventId: string, promoCodeStr?: string, ticketTypeId?: string) {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: { ticketTypes: true },
    });

    if (!event) {
      throw ApiError.notFound('Event not found');
    }

    // Creators cannot buy tickets for their own events
    if (event.creatorId === userId) {
      throw ApiError.badRequest('You cannot purchase a ticket for your own event');
    }

    // Determine pricing based on ticket types
    let basePrice = event.price;
    let capacityToCheck = event.capacity;
    let ticketTypeIdToStore: string | undefined;

    if (event.ticketTypes.length > 0) {
      // Event has ticket types — ticketTypeId is required
      if (!ticketTypeId) throw ApiError.badRequest('Ticket type is required for this event');
      const ticketType = event.ticketTypes.find((t) => t.id === ticketTypeId);
      if (!ticketType) throw ApiError.notFound('Ticket type not found');

      basePrice = ticketType.price;
      capacityToCheck = ticketType.capacity;
      ticketTypeIdToStore = ticketType.id;

      // Check type-specific capacity
      const typeTicketCount = await prisma.ticket.count({ where: { ticketTypeId } });
      if (typeTicketCount >= ticketType.capacity) {
        throw ApiError.badRequest(`${ticketType.name} tickets are sold out`);
      }
    } else {
      // Legacy flow — check overall capacity
      const ticketCount = await prisma.ticket.count({ where: { eventId } });
      if (ticketCount >= event.capacity) {
        throw ApiError.badRequest('Event is sold out');
      }
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

    // Promo code handling
    let promoCodeId: string | undefined;
    let discountAmount = 0;
    let finalPrice = basePrice;

    if (promoCodeStr && basePrice > 0) {
      const promoCode = await prisma.promoCode.findUnique({
        where: { code_creatorId: { code: promoCodeStr.toUpperCase(), creatorId: event.creatorId } },
      });

      if (!promoCode) throw ApiError.badRequest('Invalid promo code');
      if (!promoCode.isActive) throw ApiError.badRequest('This promo code is no longer active');
      if (promoCode.expiresAt && new Date() > promoCode.expiresAt) throw ApiError.badRequest('This promo code has expired');
      if (promoCode.maxUses && promoCode.usedCount >= promoCode.maxUses) throw ApiError.badRequest('This promo code has reached its usage limit');
      if (promoCode.eventId && promoCode.eventId !== eventId) throw ApiError.badRequest('This promo code is not valid for this event');

      if (promoCode.discountType === 'PERCENTAGE') {
        discountAmount = Math.round(basePrice * promoCode.discountValue / 100);
      } else {
        discountAmount = Math.min(promoCode.discountValue, basePrice);
      }

      finalPrice = Math.max(0, basePrice - discountAmount);
      promoCodeId = promoCode.id;
    }

    const reference = `EVT-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;

    // Free event or fully discounted — bypass Paystack, create ticket directly
    if (finalPrice === 0) {
      const payment = await prisma.payment.create({
        data: {
          userId,
          eventId,
          amount: 0,
          discountAmount,
          promoCodeId,
          ticketTypeId: ticketTypeIdToStore,
          paystackReference: reference,
          paystackAccessCode: 'free',
          paystackAuthUrl: 'free',
          status: 'SUCCESS',
          paidAt: new Date(),
        },
      });

      // Increment promo code usage
      if (promoCodeId) {
        await prisma.promoCode.update({ where: { id: promoCodeId }, data: { usedCount: { increment: 1 } } });
      }

      const ticket = await TicketService.createTicket(userId, eventId, payment.id, ticketTypeIdToStore);

      // Send confirmation email
      EmailService.sendTicketConfirmation(user.email, user.firstName, event, 0).catch(() => {});

      // In-app notification
      InAppNotificationService.create(
        userId,
        `Ticket confirmed for "${event.title}"`,
        'ticket_confirmed',
        `/events/${eventId}`,
      ).catch(() => {});

      // Create automatic reminder if event has default
      if (event.defaultReminderValue && event.defaultReminderUnit) {
        NotificationService.createReminder(userId, eventId, event.defaultReminderValue, event.defaultReminderUnit).catch(() => {});
      }

      return { payment, ticket, free: true };
    }

    // Paid event — go through Paystack
    const response = await fetch(`${paystackConfig.baseUrl}/transaction/initialize`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${paystackConfig.secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: user.email,
        amount: Math.round(finalPrice * 100), // Paystack uses kobo
        reference,
        callback_url: `${process.env.CLIENT_URL || 'http://localhost:5173'}/payment/callback?reference=${reference}`,
        metadata: {
          userId,
          eventId,
          eventTitle: event.title,
          promoCodeId,
          discountAmount,
          ticketTypeId: ticketTypeIdToStore,
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
        amount: finalPrice,
        discountAmount,
        promoCodeId,
        ticketTypeId: ticketTypeIdToStore,
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
      payment.id,
      payment.ticketTypeId ?? undefined,
    );

    // Increment promo code usage on successful payment
    if (payment.promoCodeId) {
      await prisma.promoCode.update({ where: { id: payment.promoCodeId }, data: { usedCount: { increment: 1 } } });
    }

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
      // In-app notification
      InAppNotificationService.create(
        payment.userId,
        `Ticket confirmed for "${event.title}"`,
        'ticket_confirmed',
        `/events/${event.id}`,
      ).catch(() => {});
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
