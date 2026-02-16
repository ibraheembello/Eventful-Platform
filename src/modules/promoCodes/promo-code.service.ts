import prisma from '../../config/database';
import { ApiError } from '../../utils/apiError';
import type { CreatePromoCodeInput, UpdatePromoCodeInput } from './promo-code.schema';

export class PromoCodeService {
  static async create(creatorId: string, input: CreatePromoCodeInput) {
    // If eventId provided, verify the creator owns the event
    if (input.eventId) {
      const event = await prisma.event.findUnique({ where: { id: input.eventId } });
      if (!event) throw ApiError.notFound('Event not found');
      if (event.creatorId !== creatorId) throw ApiError.forbidden('You can only create promo codes for your own events');
    }

    // Check for duplicate code per creator
    const existing = await prisma.promoCode.findUnique({
      where: { code_creatorId: { code: input.code, creatorId } },
    });
    if (existing) throw ApiError.conflict('You already have a promo code with this code');

    return prisma.promoCode.create({
      data: {
        code: input.code,
        discountType: input.discountType,
        discountValue: input.discountValue,
        maxUses: input.maxUses,
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : undefined,
        eventId: input.eventId,
        creatorId,
      },
      include: {
        event: { select: { id: true, title: true } },
      },
    });
  }

  static async getCreatorPromoCodes(creatorId: string, page = 1, limit = 10) {
    const [promoCodes, total] = await Promise.all([
      prisma.promoCode.findMany({
        where: { creatorId },
        include: {
          event: { select: { id: true, title: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.promoCode.count({ where: { creatorId } }),
    ]);

    return { promoCodes, total };
  }

  static async getById(id: string, creatorId: string) {
    const promoCode = await prisma.promoCode.findUnique({
      where: { id },
      include: {
        event: { select: { id: true, title: true } },
      },
    });

    if (!promoCode) throw ApiError.notFound('Promo code not found');
    if (promoCode.creatorId !== creatorId) throw ApiError.forbidden('You can only view your own promo codes');

    return promoCode;
  }

  static async update(id: string, creatorId: string, input: UpdatePromoCodeInput) {
    const promoCode = await prisma.promoCode.findUnique({ where: { id } });
    if (!promoCode) throw ApiError.notFound('Promo code not found');
    if (promoCode.creatorId !== creatorId) throw ApiError.forbidden('You can only update your own promo codes');

    return prisma.promoCode.update({
      where: { id },
      data: {
        isActive: input.isActive,
        maxUses: input.maxUses,
        expiresAt: input.expiresAt !== undefined
          ? (input.expiresAt ? new Date(input.expiresAt) : null)
          : undefined,
      },
      include: {
        event: { select: { id: true, title: true } },
      },
    });
  }

  static async delete(id: string, creatorId: string) {
    const promoCode = await prisma.promoCode.findUnique({ where: { id } });
    if (!promoCode) throw ApiError.notFound('Promo code not found');
    if (promoCode.creatorId !== creatorId) throw ApiError.forbidden('You can only delete your own promo codes');

    await prisma.promoCode.delete({ where: { id } });
    return { deleted: true };
  }

  static async validateCode(code: string, eventId: string) {
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) throw ApiError.notFound('Event not found');

    // Look up the promo code scoped to this event's creator
    const promoCode = await prisma.promoCode.findUnique({
      where: { code_creatorId: { code: code.toUpperCase(), creatorId: event.creatorId } },
    });

    if (!promoCode) throw ApiError.notFound('Promo code not found');
    if (!promoCode.isActive) throw ApiError.badRequest('This promo code is no longer active');
    if (promoCode.expiresAt && new Date() > promoCode.expiresAt) {
      throw ApiError.badRequest('This promo code has expired');
    }
    if (promoCode.maxUses && promoCode.usedCount >= promoCode.maxUses) {
      throw ApiError.badRequest('This promo code has reached its usage limit');
    }
    // If scoped to a specific event, check match
    if (promoCode.eventId && promoCode.eventId !== eventId) {
      throw ApiError.badRequest('This promo code is not valid for this event');
    }

    // Calculate discount
    let discountAmount: number;
    if (promoCode.discountType === 'PERCENTAGE') {
      discountAmount = Math.round(event.price * promoCode.discountValue / 100);
    } else {
      discountAmount = Math.min(promoCode.discountValue, event.price);
    }

    const finalPrice = Math.max(0, event.price - discountAmount);

    return {
      isValid: true,
      discountType: promoCode.discountType,
      discountValue: promoCode.discountValue,
      discountAmount,
      originalPrice: event.price,
      finalPrice,
    };
  }
}
