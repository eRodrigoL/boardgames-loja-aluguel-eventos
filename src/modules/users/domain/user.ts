import { z } from 'zod';

export const userRoleSchema = z.enum(['member', 'admin', 'super_admin']);
export type UserRole = z.infer<typeof userRoleSchema>;

const optionalText = z.string().trim().min(1).max(120).nullable().optional();

export const userProfileSchema = z.object({
  displayName: z.string().trim().min(1).max(120),
  phone: optionalText,
  city: optionalText,
});

export const userRoleInputSchema = z.object({ role: userRoleSchema });
export const userSearchQuerySchema = z.object({
  query: z.string().trim().max(120).default(''),
});

export type UserProfileInput = z.infer<typeof userProfileSchema>;
