import { z } from 'zod';

export const verifyTicketSchema = z.object({
  qrToken: z.string().min(1, 'QR token is required'),
});

export type VerifyTicketInput = z.infer<typeof verifyTicketSchema>;
