import { z } from 'zod';

const imageUrlSchema = z.string().refine(
  (val) => val.startsWith('/uploads/') || /^https?:\/\//.test(val),
  'Must be a valid URL or an uploaded image path'
);

const recurrenceSchema = z.object({
  pattern: z.enum(['WEEKLY', 'BIWEEKLY', 'MONTHLY']),
  occurrences: z.number().int().min(2, 'At least 2 occurrences required').max(52, 'Maximum 52 occurrences'),
});

export const createEventSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid date format'),
  location: z.string().min(1, 'Location is required'),
  price: z.number().min(0, 'Price must be 0 or greater'),
  capacity: z.number().int().min(1, 'Capacity must be at least 1'),
  imageUrl: imageUrlSchema.optional(),
  category: z.string().optional(),
  defaultReminderValue: z.number().int().min(1).optional(),
  defaultReminderUnit: z.enum(['MINUTES', 'HOURS', 'DAYS', 'WEEKS']).optional(),
  recurrence: recurrenceSchema.optional(),
  status: z.enum(['DRAFT', 'PUBLISHED']).optional(),
});

export const updateEventSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid date format').optional(),
  location: z.string().min(1).optional(),
  price: z.number().min(0).optional(),
  capacity: z.number().int().min(1).optional(),
  imageUrl: imageUrlSchema.optional().nullable(),
  category: z.string().optional().nullable(),
  defaultReminderValue: z.number().int().min(1).optional().nullable(),
  defaultReminderUnit: z.enum(['MINUTES', 'HOURS', 'DAYS', 'WEEKS']).optional().nullable(),
  status: z.enum(['DRAFT', 'PUBLISHED']).optional(),
});

export const createCommentSchema = z.object({
  content: z.string().min(10, 'Review must be at least 10 characters'),
  rating: z.number().int().min(1, 'Rating must be 1-5').max(5, 'Rating must be 1-5'),
});

export const addEventImageSchema = z.object({
  url: imageUrlSchema,
  caption: z.string().max(200).optional(),
});

export const reorderImagesSchema = z.object({
  imageIds: z.array(z.string().uuid()).min(1, 'At least one image ID is required'),
});

export const updateImageSchema = z.object({
  caption: z.string().max(200).optional().nullable(),
});

export const ticketTypeSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  price: z.number().min(0, 'Price must be 0 or greater'),
  capacity: z.number().int().min(1, 'Capacity must be at least 1'),
  description: z.string().optional(),
  sortOrder: z.number().int().optional(),
});

export const createTicketTypesSchema = z.object({
  types: z.array(ticketTypeSchema).min(1, 'At least one ticket type is required'),
});

export const updateTicketTypeSchema = z.object({
  name: z.string().min(1).optional(),
  price: z.number().min(0).optional(),
  capacity: z.number().int().min(1).optional(),
  description: z.string().optional().nullable(),
  sortOrder: z.number().int().optional(),
});

export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type TicketTypeInput = z.infer<typeof ticketTypeSchema>;
