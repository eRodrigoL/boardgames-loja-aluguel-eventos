import type { GameInput, GameListQuery } from '../domain/game';
import { eq } from 'drizzle-orm';
import { AppError, notFound } from '../../../shared/errors/app-error';
import { createDatabase } from '../../../shared/database/client';
import { gameImages } from '../../../shared/database/schema';

type GameRow = Omit<GameInput, 'tags'> & {
  id: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};
type ImageRow = {
  id: string;
  mimeType: string;
  sizeBytes: number;
  altText: string | null;
  position: number;
};
type TagRow = { id: string; name: string; slug: string };

const columns = `id, slug, name, publisher, edition_release_year as editionReleaseYear, min_players as minPlayers, max_players as maxPlayers,
 average_duration_minutes as averageDurationMinutes, minimum_age as minimumAge, description, full_description as fullDescription,
 sale_price_cents as salePriceCents, weekly_rental_price_cents as weeklyRentalPriceCents,
 available_for_sale as availableForSale, available_for_rental as availableForRental, box_width_mm as boxWidthMm,
 box_height_mm as boxHeightMm, box_depth_mm as boxDepthMm, box_weight_grams as boxWeightGrams,
 availability, availability_forecast_at as availabilityForecastAt, featured, published, active,
 deleted_at as deletedAt, created_at as createdAt, updated_at as updatedAt`;

const now = () => new Date().toISOString();
const imageUrl = (id: string) => `/api/media/images/${id}`;

export class GameRepository {
  private readonly orm;

  constructor(private readonly db: D1Database) {
    this.orm = createDatabase(db);
  }

  async create(input: GameInput) {
    if (input.published)
      throw new AppError('GAME_REQUIRES_IMAGE', 422, 'A published game needs at least one image.');
    const id = crypto.randomUUID();
    const timestamp = now();
    await this.db
      .prepare(
        `INSERT INTO games (id, slug, name, publisher, edition_release_year, min_players, max_players, average_duration_minutes, minimum_age, description, full_description, sale_price_cents, weekly_rental_price_cents, available_for_sale, available_for_rental, box_width_mm, box_height_mm, box_depth_mm, box_weight_grams, availability, availability_forecast_at, featured, published, active, deleted_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        id,
        input.slug,
        input.name,
        input.publisher ?? null,
        input.editionReleaseYear ?? null,
        input.minPlayers ?? null,
        input.maxPlayers ?? null,
        input.averageDurationMinutes ?? null,
        input.minimumAge ?? null,
        input.description ?? null,
        input.fullDescription ?? null,
        input.salePriceCents ?? null,
        input.weeklyRentalPriceCents ?? null,
        Number(input.availableForSale),
        Number(input.availableForRental),
        input.boxWidthMm ?? null,
        input.boxHeightMm ?? null,
        input.boxDepthMm ?? null,
        input.boxWeightGrams ?? null,
        input.availability,
        input.availabilityForecastAt ?? null,
        Number(input.featured),
        Number(input.published),
        Number(input.active),
        null,
        timestamp,
        timestamp,
      )
      .run();
    await this.replaceTags(id, input.tags);
    return this.byId(id, true);
  }

  async update(id: string, input: GameInput) {
    await this.requireById(id, true);
    const timestamp = now();
    await this.db
      .prepare(
        `UPDATE games SET slug = ?, name = ?, publisher = ?, edition_release_year = ?, min_players = ?, max_players = ?, average_duration_minutes = ?, minimum_age = ?, description = ?, full_description = ?, sale_price_cents = ?, weekly_rental_price_cents = ?, available_for_sale = ?, available_for_rental = ?, box_width_mm = ?, box_height_mm = ?, box_depth_mm = ?, box_weight_grams = ?, availability = ?, availability_forecast_at = ?, featured = ?, published = ?, active = ?, updated_at = ? WHERE id = ?`,
      )
      .bind(
        input.slug,
        input.name,
        input.publisher ?? null,
        input.editionReleaseYear ?? null,
        input.minPlayers ?? null,
        input.maxPlayers ?? null,
        input.averageDurationMinutes ?? null,
        input.minimumAge ?? null,
        input.description ?? null,
        input.fullDescription ?? null,
        input.salePriceCents ?? null,
        input.weeklyRentalPriceCents ?? null,
        Number(input.availableForSale),
        Number(input.availableForRental),
        input.boxWidthMm ?? null,
        input.boxHeightMm ?? null,
        input.boxDepthMm ?? null,
        input.boxWeightGrams ?? null,
        input.availability,
        input.availabilityForecastAt ?? null,
        Number(input.featured),
        Number(input.published),
        Number(input.active),
        timestamp,
        id,
      )
      .run();
    await this.replaceTags(id, input.tags);
    if (input.published) await this.ensurePublishable(id);
    return this.byId(id, true);
  }

  async updateAvailability(id: string, availability: string, forecast: string | null | undefined) {
    await this.requireById(id, true);
    await this.db
      .prepare(
        'UPDATE games SET availability = ?, availability_forecast_at = ?, updated_at = ? WHERE id = ?',
      )
      .bind(availability, forecast ?? null, now(), id)
      .run();
    return this.byId(id, true);
  }

  async updateFlag(id: string, column: 'published' | 'active', value: boolean) {
    await this.requireById(id, true);
    if (column === 'published' && value) await this.ensurePublishable(id);
    await this.db
      .prepare(`UPDATE games SET ${column} = ?, updated_at = ? WHERE id = ?`)
      .bind(Number(value), now(), id)
      .run();
    return this.byId(id, true);
  }

  async softDelete(id: string) {
    await this.requireById(id, true);
    await this.db
      .prepare('UPDATE games SET active = 0, deleted_at = ?, updated_at = ? WHERE id = ?')
      .bind(now(), now(), id)
      .run();
  }

  async byId(id: string, admin = false) {
    const row = await this.db
      .prepare(
        `SELECT ${columns} FROM games WHERE id = ? ${admin ? '' : 'AND active = 1 AND published = 1 AND deleted_at IS NULL'}`,
      )
      .bind(id)
      .first<GameRow>();
    if (!row) throw notFound('Game');
    return this.hydrate(row);
  }

  async bySlug(slug: string) {
    const row = await this.db
      .prepare(
        `SELECT ${columns} FROM games WHERE slug = ? AND active = 1 AND published = 1 AND deleted_at IS NULL`,
      )
      .bind(slug)
      .first<GameRow>();
    if (!row) throw notFound('Game');
    return this.hydrate(row);
  }

  async list(query: GameListQuery, admin = false) {
    const values: unknown[] = [];
    const conditions = admin
      ? ['deleted_at IS NULL']
      : [
          'active = 1',
          'published = 1',
          'deleted_at IS NULL',
          'EXISTS (SELECT 1 FROM game_images i WHERE i.game_id = games.id)',
        ];
    if (query.q) {
      conditions.push("(lower(name) LIKE ? OR lower(coalesce(description, '')) LIKE ?)");
      values.push(`%${query.q.toLowerCase()}%`, `%${query.q.toLowerCase()}%`);
    }
    if (query.tag) {
      conditions.push(
        'EXISTS (SELECT 1 FROM game_tags gt JOIN tags t ON t.id = gt.tag_id WHERE gt.game_id = games.id AND t.slug = ?)',
      );
      values.push(query.tag);
    }
    if (query.publisher) {
      conditions.push('lower(publisher) = ?');
      values.push(query.publisher.toLowerCase());
    }
    if (query.players) {
      conditions.push(
        '(min_players IS NULL OR min_players <= ?) AND (max_players IS NULL OR max_players >= ?)',
      );
      values.push(query.players, query.players);
    }
    if (query.availability) {
      conditions.push('availability = ?');
      values.push(query.availability);
    }
    if (query.fulfillment === 'sale') conditions.push('available_for_sale = 1');
    if (query.fulfillment === 'rental') conditions.push('available_for_rental = 1');
    if (query.featured !== undefined) {
      conditions.push('featured = ?');
      values.push(Number(query.featured));
    }
    const orderBy = { name: 'name', createdAt: 'created_at', price: 'weekly_rental_price_cents' }[
      query.order
    ];
    const direction = query.direction.toUpperCase();
    const where = conditions.join(' AND ');
    const total = await this.db
      .prepare(`SELECT count(*) as total FROM games WHERE ${where}`)
      .bind(...values)
      .first<{ total: number }>();
    const rows = await this.db
      .prepare(
        `SELECT ${columns} FROM games WHERE ${where} ORDER BY ${orderBy} ${direction}, id ASC LIMIT ? OFFSET ?`,
      )
      .bind(...values, query.pageSize, (query.page - 1) * query.pageSize)
      .all<GameRow>();
    return {
      items: await Promise.all(rows.results.map((row) => this.hydrate(row))),
      total: total?.total ?? 0,
    };
  }

  async addImage(
    gameId: string,
    image: {
      id: string;
      objectKey: string;
      mimeType: string;
      sizeBytes: number;
      altText: string | null;
    },
  ) {
    await this.requireById(gameId, true);
    const count = await this.db
      .prepare('SELECT count(*) as count FROM game_images WHERE game_id = ?')
      .bind(gameId)
      .first<{ count: number }>();
    if ((count?.count ?? 0) >= 5)
      throw new AppError('IMAGE_LIMIT_REACHED', 422, 'A game can have at most five images.');
    const timestamp = now();
    await this.db
      .prepare(
        'INSERT INTO game_images (id, game_id, object_key, mime_type, size_bytes, alt_text, position, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      )
      .bind(
        image.id,
        gameId,
        image.objectKey,
        image.mimeType,
        image.sizeBytes,
        image.altText,
        count?.count ?? 0,
        timestamp,
        timestamp,
      )
      .run();
    return this.byId(gameId, true);
  }

  async imageRecord(imageId: string) {
    return this.db
      .prepare(
        'SELECT i.id, i.game_id as gameId, i.object_key as objectKey, i.mime_type as mimeType, i.size_bytes as sizeBytes, i.alt_text as altText, i.position, g.active, g.published, g.deleted_at as deletedAt FROM game_images i JOIN games g ON g.id = i.game_id WHERE i.id = ?',
      )
      .bind(imageId)
      .first<{
        id: string;
        gameId: string;
        objectKey: string;
        mimeType: string;
        sizeBytes: number;
        altText: string | null;
        position: number;
        active: number;
        published: number;
        deletedAt: string | null;
      }>();
  }

  async deleteImage(gameId: string, imageId: string) {
    const image = await this.imageRecord(imageId);
    if (!image || image.gameId !== gameId) throw notFound('Image');
    await this.db.prepare('DELETE FROM game_images WHERE id = ?').bind(imageId).run();
    await this.db
      .prepare(
        'UPDATE game_images SET position = position - 1, updated_at = ? WHERE game_id = ? AND position > ?',
      )
      .bind(now(), gameId, image.position)
      .run();
    return image;
  }

  async reorderImages(gameId: string, imageIds: string[]) {
    const images = await this.db
      .prepare('SELECT id FROM game_images WHERE game_id = ? ORDER BY position')
      .bind(gameId)
      .all<{ id: string }>();
    if (
      images.results.length !== imageIds.length ||
      new Set(imageIds).size !== imageIds.length ||
      images.results.some((image) => !imageIds.includes(image.id))
    )
      throw new AppError(
        'INVALID_IMAGE_ORDER',
        422,
        'The image order must include every image exactly once.',
      );
    const timestamp = now();
    await this.db.batch(
      imageIds.map((id, index) =>
        this.db
          .prepare('UPDATE game_images SET position = ?, updated_at = ? WHERE id = ?')
          .bind(-(index + 1), timestamp, id),
      ),
    );
    await this.db.batch(
      imageIds.map((id, index) =>
        this.db
          .prepare('UPDATE game_images SET position = ?, updated_at = ? WHERE id = ?')
          .bind(index, timestamp, id),
      ),
    );
    return this.byId(gameId, true);
  }

  private async requireById(id: string, admin: boolean) {
    return this.byId(id, admin);
  }
  private async ensurePublishable(id: string) {
    const images = await this.orm
      .select({ id: gameImages.id })
      .from(gameImages)
      .where(eq(gameImages.gameId, id))
      .limit(1);
    if (!images[0])
      throw new AppError('GAME_REQUIRES_IMAGE', 422, 'A published game needs at least one image.');
  }
  private async replaceTags(gameId: string, names: string[]) {
    await this.db.prepare('DELETE FROM game_tags WHERE game_id = ?').bind(gameId).run();
    for (const rawName of names) {
      const name = rawName.replace(/\s+/g, ' ').trim();
      const slug = name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      let tag = await this.db
        .prepare('SELECT id FROM tags WHERE slug = ? COLLATE NOCASE')
        .bind(slug)
        .first<{ id: string }>();
      if (!tag) {
        const id = crypto.randomUUID();
        const timestamp = now();
        await this.db
          .prepare(
            'INSERT INTO tags (id, name, slug, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
          )
          .bind(id, name, slug, timestamp, timestamp)
          .run();
        tag = { id };
      }
      await this.db
        .prepare('INSERT INTO game_tags (game_id, tag_id) VALUES (?, ?)')
        .bind(gameId, tag.id)
        .run();
    }
  }
  private async hydrate(row: GameRow) {
    const [imageResult, tagResult] = await Promise.all([
      this.db
        .prepare(
          'SELECT id, mime_type as mimeType, size_bytes as sizeBytes, alt_text as altText, position FROM game_images WHERE game_id = ? ORDER BY position',
        )
        .bind(row.id)
        .all<ImageRow>(),
      this.db
        .prepare(
          'SELECT t.id, t.name, t.slug FROM tags t JOIN game_tags gt ON gt.tag_id = t.id WHERE gt.game_id = ? ORDER BY t.name',
        )
        .bind(row.id)
        .all<TagRow>(),
    ]);
    return {
      ...row,
      featured: Boolean(row.featured),
      availableForSale: Boolean(row.availableForSale),
      availableForRental: Boolean(row.availableForRental),
      published: Boolean(row.published),
      active: Boolean(row.active),
      images: imageResult.results.map((image) => ({ ...image, url: imageUrl(image.id) })),
      tags: tagResult.results,
    };
  }
}
