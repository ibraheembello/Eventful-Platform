import { z } from 'zod';

export const createEventSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid date format'),
  location: z.string().min(1, 'Location is required'),
  price: z.number().min(0, 'Price must be 0 or greater'),
  capacity: z.number().int().min(1, 'Capacity must be at least 1'),
  imageUrl: z.string().url().optional(),
  category: z.string().optional(),
  defaultReminderValue: z.number().int().min(1).optional(),
  defaultReminderUnit: z.enum(['MINUTES', 'HOURS', 'DAYS', 'WEEKS']).optional(),
});

export const updateEventSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid date format').optional(),
  location: z.string().min(1).optional(),
  price: z.number().min(0).optional(),
  capacity: z.number().int().min(1).optional(),
  imageUrl: z.string().url().optional().nullable(),
  category: z.string().optional().nullable(),
  defaultReminderValue: z.number().int().min(1).optional().nullable(),
  defaultReminderUnit: z.enum(['MINUTES', 'HOURS', 'DAYS', 'WEEKS']).optional().nullable(),
});

export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
