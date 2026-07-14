import {
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core';

const timestamps = {
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
};

export const games = sqliteTable(
  'games',
  {
    id: text('id').primaryKey(),
    slug: text('slug').notNull(),
    name: text('name').notNull(),
    publisher: text('publisher'),
    minPlayers: integer('min_players'),
    maxPlayers: integer('max_players'),
    averageDurationMinutes: integer('average_duration_minutes'),
    minimumAge: integer('minimum_age'),
    description: text('description'),
    weeklyRentalPriceCents: integer('weekly_rental_price_cents'),
    boxWidthMm: integer('box_width_mm'),
    boxHeightMm: integer('box_height_mm'),
    boxDepthMm: integer('box_depth_mm'),
    boxWeightGrams: integer('box_weight_grams'),
    availability: text('availability').notNull(),
    availabilityForecastAt: text('availability_forecast_at'),
    featured: integer('featured', { mode: 'boolean' }).notNull().default(false),
    published: integer('published', { mode: 'boolean' }).notNull().default(false),
    active: integer('active', { mode: 'boolean' }).notNull().default(true),
    deletedAt: text('deleted_at'),
    ...timestamps,
  },
  (table) => [
    uniqueIndex('games_slug_unique').on(table.slug),
    index('games_public_index').on(table.active, table.published, table.deletedAt),
    index('games_availability_index').on(table.availability),
    index('games_featured_index').on(table.featured),
  ],
);

export const tags = sqliteTable(
  'tags',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    slug: text('slug').notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex('tags_slug_unique').on(table.slug),
    uniqueIndex('tags_name_unique').on(table.name),
  ],
);

export const gameTags = sqliteTable(
  'game_tags',
  { gameId: text('game_id').notNull(), tagId: text('tag_id').notNull() },
  (table) => [
    primaryKey({ columns: [table.gameId, table.tagId] }),
    index('game_tags_tag_index').on(table.tagId, table.gameId),
  ],
);

export const gameImages = sqliteTable(
  'game_images',
  {
    id: text('id').primaryKey(),
    gameId: text('game_id').notNull(),
    objectKey: text('object_key').notNull(),
    mimeType: text('mime_type').notNull(),
    sizeBytes: integer('size_bytes').notNull(),
    altText: text('alt_text'),
    position: integer('position').notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex('game_images_object_key_unique').on(table.objectKey),
    uniqueIndex('game_images_game_position_unique').on(table.gameId, table.position),
    index('game_images_game_index').on(table.gameId, table.position),
  ],
);

export const events = sqliteTable(
  'events',
  {
    id: text('id').primaryKey(),
    slug: text('slug').notNull(),
    title: text('title').notNull(),
    summary: text('summary'),
    description: text('description').notNull(),
    location: text('location'),
    startsAt: text('starts_at').notNull(),
    endsAt: text('ends_at'),
    contact: text('contact'),
    coverImageKey: text('cover_image_key'),
    featured: integer('featured', { mode: 'boolean' }).notNull().default(false),
    published: integer('published', { mode: 'boolean' }).notNull().default(false),
    active: integer('active', { mode: 'boolean' }).notNull().default(true),
    deletedAt: text('deleted_at'),
    ...timestamps,
  },
  (table) => [
    uniqueIndex('events_slug_unique').on(table.slug),
    index('events_public_index').on(table.active, table.published, table.deletedAt, table.startsAt),
    index('events_featured_index').on(table.featured),
  ],
);

export const siteConfig = sqliteTable('site_config', {
  id: integer('id').primaryKey(),
  businessName: text('business_name').notNull(),
  phone: text('phone'),
  whatsapp: text('whatsapp'),
  email: text('email'),
  serviceRegion: text('service_region'),
  defaultRentalPeriodDays: integer('default_rental_period_days').notNull(),
  socialLinksJson: text('social_links_json').notNull(),
  contactMessage: text('contact_message'),
  updatedAt: text('updated_at').notNull(),
});
