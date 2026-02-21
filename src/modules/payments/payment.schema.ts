import { z } from 'zod';

export const initializePaymentSchema = z.object({
  eventId: z.string().uuid('Invalid event ID'),
  promoCode: z.string().optional(),
  ticketTypeId: z.string().uuid().optional(),
});

export type InitializePaymentInput = z.infer<typeof initializePaymentSchema>;
