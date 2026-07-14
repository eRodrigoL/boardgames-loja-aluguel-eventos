import { z } from 'zod';

export const siteConfigSchema = z.object({
  businessName: z.string().trim().min(1).max(200),
  phone: z.string().trim().min(1).max(50).nullable().optional(),
  whatsapp: z.string().trim().min(1).max(50).nullable().optional(),
  email: z.string().email().max(254).nullable().optional(),
  serviceRegion: z.string().trim().min(1).max(300).nullable().optional(),
  defaultRentalPeriodDays: z.number().int().positive().max(365),
  socialLinks: z.record(z.string().max(40), z.string().url().max(500)).default({}),
  contactMessage: z.string().trim().min(1).max(2000).nullable().optional(),
});
export type SiteConfigInput = z.infer<typeof siteConfigSchema>;
