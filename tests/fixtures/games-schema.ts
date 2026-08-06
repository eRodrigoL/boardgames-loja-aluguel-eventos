export const gamesSchema = [
  `CREATE TABLE games (
    id TEXT PRIMARY KEY, slug TEXT NOT NULL UNIQUE, name TEXT NOT NULL, publisher TEXT, edition_release_year INTEGER,
    min_players INTEGER, max_players INTEGER, average_duration_minutes INTEGER, minimum_age INTEGER,
    description TEXT, full_description TEXT, sale_price_cents INTEGER, weekly_rental_price_cents INTEGER, available_for_sale INTEGER NOT NULL DEFAULT 0, available_for_rental INTEGER NOT NULL DEFAULT 1, box_width_mm INTEGER, box_height_mm INTEGER,
    box_depth_mm INTEGER, box_weight_grams INTEGER, availability TEXT NOT NULL,
    availability_forecast_at TEXT, featured INTEGER NOT NULL, published INTEGER NOT NULL,
    active INTEGER NOT NULL, deleted_at TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
  )`,
  'CREATE TABLE tags (id TEXT PRIMARY KEY, name TEXT NOT NULL UNIQUE COLLATE NOCASE, slug TEXT NOT NULL UNIQUE COLLATE NOCASE, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)',
  'CREATE TABLE game_tags (game_id TEXT NOT NULL, tag_id TEXT NOT NULL, PRIMARY KEY (game_id, tag_id))',
  'CREATE TABLE game_images (id TEXT PRIMARY KEY, game_id TEXT NOT NULL, object_key TEXT NOT NULL UNIQUE, mime_type TEXT NOT NULL, size_bytes INTEGER NOT NULL, alt_text TEXT, position INTEGER NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, UNIQUE(game_id, position))',
];
