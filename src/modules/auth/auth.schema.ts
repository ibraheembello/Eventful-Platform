import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  role: z.enum(['CREATOR', 'EVENTEE'], {
    error: 'Role must be CREATOR or EVENTEE',
  }),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const updateProfileSchema = z.object({
  firstName: z.string().min(1, 'First name is required').optional(),
  lastName: z.string().min(1, 'Last name is required').optional(),
  profileImage: z.string().refine(
    (val) => val.startsWith('/uploads/') || /^https?:\/\//.test(val),
    'Must be a valid URL or upload path'
  ).optional(),
});

export const googleAuthSchema = z.object({
  credential: z.string().min(1, 'Google credential is required'),
  role: z.enum(['CREATOR', 'EVENTEE']).optional(),
});

export const githubAuthSchema = z.object({
  code: z.string().min(1, 'GitHub authorization code is required'),
  role: z.enum(['CREATOR', 'EVENTEE']).optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type GoogleAuthInput = z.infer<typeof googleAuthSchema>;
export type GitHubAuthInput = z.infer<typeof githubAuthSchema>;
