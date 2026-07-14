import { z } from 'zod';
import { booleanQuerySchema, isoDateSchema, slugSchema } from '../../../shared/validation/common';

export const availabilitySchema = z.enum([
  'available',
  'rented',
  'reserved',
  'maintenance',
  'unavailable',
]);
const positiveInteger = z.number().int().positive();
const nullableString = z.string().trim().min(1).max(10_000).nullable().optional();

export const gameInputSchema = z
  .object({
    slug: slugSchema,
    name: z.string().trim().min(1).max(200),
    publisher: nullableString,
    minPlayers: positiveInteger.nullable().optional(),
    maxPlayers: positiveInteger.nullable().optional(),
    averageDurationMinutes: positiveInteger.max(1440).nullable().optional(),
    minimumAge: z.number().int().min(0).max(99).nullable().optional(),
    description: nullableString,
    weeklyRentalPriceCents: z.number().int().min(0).max(10_000_000).nullable().optional(),
    boxWidthMm: positiveInteger.max(5000).nullable().optional(),
    boxHeightMm: positiveInteger.max(5000).nullable().optional(),
    boxDepthMm: positiveInteger.max(5000).nullable().optional(),
    boxWeightGrams: positiveInteger.max(100_000).nullable().optional(),
    availability: availabilitySchema.default('available'),
    availabilityForecastAt: isoDateSchema.nullable().optional(),
    featured: z.boolean().default(false),
    published: z.boolean().default(false),
    active: z.boolean().default(true),
    tags: z.array(z.string().trim().min(1).max(60)).max(20).default([]),
  })
  .superRefine((value, ctx) => {
    if (value.minPlayers && value.maxPlayers && value.maxPlayers < value.minPlayers) {
      ctx.addIssue({
        code: 'custom',
        path: ['maxPlayers'],
        message: 'Must not be less than minPlayers.',
      });
    }
    value.tags.forEach((tag, index) => {
      const slug = tag
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      if (!slug) {
        ctx.addIssue({
          code: 'custom',
          path: ['tags', index],
          message: 'Must contain characters that can form a slug.',
        });
      }
    });
  });

export const gameListQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  tag: slugSchema.optional(),
  publisher: z.string().trim().max(120).optional(),
  players: z.coerce.number().int().positive().max(100).optional(),
  availability: availabilitySchema.optional(),
  featured: booleanQuerySchema.optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
  order: z.enum(['name', 'createdAt', 'price']).default('name'),
  direction: z.enum(['asc', 'desc']).default('asc'),
});

export const availabilityInputSchema = z.object({
  availability: availabilitySchema,
  availabilityForecastAt: isoDateSchema.nullable().optional(),
});
export const flagInputSchema = z.object({ value: z.boolean() });

export type GameInput = z.infer<typeof gameInputSchema>;
export type GameListQuery = z.infer<typeof gameListQuerySchema>;
