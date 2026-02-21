import { z } from 'zod';

export const changeRoleSchema = z.object({
  role: z.enum(['CREATOR', 'EVENTEE', 'ADMIN']),
});

export const suspendUserSchema = z.object({
  suspended: z.boolean(),
});

export const adminUsersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  search: z.string().optional(),
  role: z.enum(['CREATOR', 'EVENTEE', 'ADMIN']).optional(),
});

export type ChangeRoleInput = z.infer<typeof changeRoleSchema>;
export type SuspendUserInput = z.infer<typeof suspendUserSchema>;
