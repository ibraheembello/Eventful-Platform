import { z } from 'zod';

export const initiateTransferSchema = z.object({
  recipientEmail: z.string().email('Invalid email address'),
});

export type InitiateTransferInput = z.infer<typeof initiateTransferSchema>;
