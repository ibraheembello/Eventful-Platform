import { z } from 'zod';

export const createReminderSchema = z.object({
  eventId: z.string().uuid('Invalid event ID'),
  reminderValue: z.number().int().min(1, 'Reminder value must be at least 1'),
  reminderUnit: z.enum(['MINUTES', 'HOURS', 'DAYS', 'WEEKS'], {
    error: 'Reminder unit must be MINUTES, HOURS, DAYS, or WEEKS',
  }),
});

export const updateReminderSchema = z.object({
  reminderValue: z.number().int().min(1).optional(),
  reminderUnit: z.enum(['MINUTES', 'HOURS', 'DAYS', 'WEEKS']).optional(),
});

export type CreateReminderInput = z.infer<typeof createReminderSchema>;
export type UpdateReminderInput = z.infer<typeof updateReminderSchema>;
