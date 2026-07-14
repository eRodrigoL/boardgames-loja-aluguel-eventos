import { z } from 'zod';
import { booleanQuerySchema, isoDateSchema, slugSchema } from '../../../shared/validation/common';

const optionalText = z.string().trim().min(1).max(10_000).nullable().optional();
export const eventInputSchema = z
  .object({
    slug: slugSchema,
    title: z.string().trim().min(1).max(200),
    summary: optionalText,
    description: z.string().trim().min(1).max(20_000),
    location: optionalText,
    startsAt: isoDateSchema,
    endsAt: isoDateSchema.nullable().optional(),
    contact: optionalText,
    featured: z.boolean().default(false),
    published: z.boolean().default(false),
    active: z.boolean().default(true),
  })
  .superRefine((value, ctx) => {
    if (value.endsAt && value.endsAt < value.startsAt)
      ctx.addIssue({ code: 'custom', path: ['endsAt'], message: 'Must not precede startsAt.' });
  });
export const eventListQuerySchema = z.object({
  future: booleanQuerySchema.optional(),
  featured: booleanQuerySchema.optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
  direction: z.enum(['asc', 'desc']).default('asc'),
});
export const eventFlagSchema = z.object({ value: z.boolean() });
export type EventInput = z.infer<typeof eventInputSchema>;
export type EventListQuery = z.infer<typeof eventListQuerySchema>;
