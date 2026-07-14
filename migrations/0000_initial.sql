PRAGMA foreign_keys = ON;

CREATE TABLE games (
  id TEXT PRIMARY KEY NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  publisher TEXT,
  min_players INTEGER CHECK (min_players IS NULL OR min_players > 0),
  max_players INTEGER CHECK (max_players IS NULL OR max_players > 0),
  average_duration_minutes INTEGER CHECK (average_duration_minutes IS NULL OR average_duration_minutes > 0),
  minimum_age INTEGER CHECK (minimum_age IS NULL OR minimum_age >= 0),
  description TEXT,
  weekly_rental_price_cents INTEGER CHECK (weekly_rental_price_cents IS NULL OR weekly_rental_price_cents >= 0),
  box_width_mm INTEGER CHECK (box_width_mm IS NULL OR box_width_mm > 0),
  box_height_mm INTEGER CHECK (box_height_mm IS NULL OR box_height_mm > 0),
  box_depth_mm INTEGER CHECK (box_depth_mm IS NULL OR box_depth_mm > 0),
  box_weight_grams INTEGER CHECK (box_weight_grams IS NULL OR box_weight_grams > 0),
  availability TEXT NOT NULL CHECK (availability IN ('available', 'rented', 'reserved', 'maintenance', 'unavailable')),
  availability_forecast_at TEXT,
  featured INTEGER NOT NULL DEFAULT 0 CHECK (featured IN (0, 1)),
  published INTEGER NOT NULL DEFAULT 0 CHECK (published IN (0, 1)),
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
  deleted_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  CHECK (max_players IS NULL OR min_players IS NULL OR max_players >= min_players)
);
CREATE INDEX games_public_index ON games(active, published, deleted_at);
CREATE INDEX games_availability_index ON games(availability);
CREATE INDEX games_featured_index ON games(featured);

CREATE TABLE tags (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL UNIQUE COLLATE NOCASE,
  slug TEXT NOT NULL UNIQUE COLLATE NOCASE,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE game_tags (
  game_id TEXT NOT NULL REFERENCES games(id),
  tag_id TEXT NOT NULL REFERENCES tags(id),
  PRIMARY KEY (game_id, tag_id)
);
CREATE INDEX game_tags_tag_index ON game_tags(tag_id, game_id);

CREATE TABLE game_images (
  id TEXT PRIMARY KEY NOT NULL,
  game_id TEXT NOT NULL REFERENCES games(id),
  object_key TEXT NOT NULL UNIQUE,
  mime_type TEXT NOT NULL CHECK (mime_type IN ('image/jpeg', 'image/png', 'image/webp')),
  size_bytes INTEGER NOT NULL CHECK (size_bytes > 0),
  alt_text TEXT,
  position INTEGER NOT NULL CHECK (position >= 0),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (game_id, position)
);
CREATE INDEX game_images_game_index ON game_images(game_id, position);

CREATE TABLE events (
  id TEXT PRIMARY KEY NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  summary TEXT,
  description TEXT NOT NULL,
  location TEXT,
  starts_at TEXT NOT NULL,
  ends_at TEXT,
  contact TEXT,
  cover_image_key TEXT,
  featured INTEGER NOT NULL DEFAULT 0 CHECK (featured IN (0, 1)),
  published INTEGER NOT NULL DEFAULT 0 CHECK (published IN (0, 1)),
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
  deleted_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  CHECK (ends_at IS NULL OR ends_at >= starts_at)
);
CREATE INDEX events_public_index ON events(active, published, deleted_at, starts_at);
CREATE INDEX events_featured_index ON events(featured);

CREATE TABLE site_config (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  business_name TEXT NOT NULL,
  phone TEXT,
  whatsapp TEXT,
  email TEXT,
  service_region TEXT,
  default_rental_period_days INTEGER NOT NULL CHECK (default_rental_period_days > 0),
  social_links_json TEXT NOT NULL,
  contact_message TEXT,
  updated_at TEXT NOT NULL
);
