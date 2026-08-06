import { z } from 'zod';

const envSchema = z.object({
  DB: z.custom<D1Database>(),
  MEDIA: z.custom<R2Bucket>(),
  PUBLIC_ORIGINS: z.string().min(1),
  ACCESS_ISSUER: z.string().url(),
  ACCESS_AUDIENCE: z.string().min(1),
  ACCESS_JWKS_URL: z.string().url(),
  BOOTSTRAP_SUPER_ADMIN_EMAIL: z.string().email().optional(),
  MAX_IMAGE_BYTES: z.coerce
    .number()
    .int()
    .positive()
    .max(25 * 1024 * 1024)
    .default(8 * 1024 * 1024),
});

export type Env = z.infer<typeof envSchema>;

export function getEnv(value: unknown): Env {
  return envSchema.parse(value);
}
