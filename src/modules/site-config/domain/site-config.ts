import { z } from 'zod';

const publicUrlSchema = z
  .string()
  .url()
  .max(500)
  .refine((value) => {
    try {
      const protocol = new URL(value).protocol;
      return protocol === 'http:' || protocol === 'https:';
    } catch {
      return false;
    }
  }, 'A public URL must use HTTP or HTTPS.');

export const siteConfigSchema = z.object({
  businessName: z.string().trim().min(1).max(200),
  phone: z.string().trim().min(1).max(50).nullable().optional(),
  whatsapp: z.string().trim().min(1).max(50).nullable().optional(),
  email: z.string().email().max(254).nullable().optional(),
  serviceRegion: z.string().trim().min(1).max(300).nullable().optional(),
  defaultRentalPeriodDays: z.number().int().positive().max(365),
  socialLinks: z.record(z.string().max(40), publicUrlSchema).default({}),
  contactMessage: z.string().trim().min(1).max(2000).nullable().optional(),
});
export type SiteConfigInput = z.infer<typeof siteConfigSchema>;

export const siteBrandAssetSchema = z.enum(['logo', 'icon']);
export type SiteBrandAsset = z.infer<typeof siteBrandAssetSchema>;
