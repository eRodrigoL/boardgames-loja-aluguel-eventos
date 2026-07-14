import { z } from 'zod';
import { AppError } from '../errors/app-error';

export const idSchema = z.string().uuid();
export const slugSchema = z
  .string()
  .trim()
  .min(1)
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
export const isoDateSchema = z
  .string()
  .datetime({ offset: true })
  .transform((value) => new Date(value).toISOString());
export const booleanQuerySchema = z.enum(['true', 'false']).transform((value) => value === 'true');

export function parseOrThrow<T>(schema: z.ZodType<T>, input: unknown): T {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    throw new AppError(
      'VALIDATION_ERROR',
      400,
      'One or more fields are invalid.',
      parsed.error.issues,
    );
  }
  return parsed.data;
}
