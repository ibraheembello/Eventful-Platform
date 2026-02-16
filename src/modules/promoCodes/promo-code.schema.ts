import { z } from 'zod';

export const createPromoCodeSchema = z.object({
  code: z.string()
    .min(3, 'Code must be at least 3 characters')
    .max(20, 'Code must be at most 20 characters')
    .regex(/^[A-Z0-9_-]+$/, 'Code must contain only uppercase letters, numbers, hyphens, and underscores')
    .transform((val) => val.toUpperCase()),
  discountType: z.enum(['PERCENTAGE', 'FIXED']),
  discountValue: z.number().positive('Discount value must be greater than 0'),
  maxUses: z.number().int().min(1).optional(),
  expiresAt: z.string().datetime().optional(),
  eventId: z.string().uuid('Invalid event ID').optional(),
}).refine(
  (data) => !(data.discountType === 'PERCENTAGE' && data.discountValue > 100),
  { message: 'Percentage discount cannot exceed 100', path: ['discountValue'] },
);

export const updatePromoCodeSchema = z.object({
  isActive: z.boolean().optional(),
  maxUses: z.number().int().min(1).optional(),
  expiresAt: z.string().datetime().optional().nullable(),
});

export const applyPromoCodeSchema = z.object({
  code: z.string().min(1, 'Promo code is required'),
  eventId: z.string().uuid('Invalid event ID'),
});

export type CreatePromoCodeInput = z.infer<typeof createPromoCodeSchema>;
export type UpdatePromoCodeInput = z.infer<typeof updatePromoCodeSchema>;
export type ApplyPromoCodeInput = z.infer<typeof applyPromoCodeSchema>;
