import { z } from 'zod';

export const inviteCollaboratorSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export type InviteCollaboratorInput = z.infer<typeof inviteCollaboratorSchema>;
