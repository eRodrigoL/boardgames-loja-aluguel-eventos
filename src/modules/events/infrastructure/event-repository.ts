import { notFound } from '../../../shared/errors/app-error';
import type { EventInput, EventListQuery } from '../domain/event';

const columns = `id, slug, title, summary, description, full_description as fullDescription, location, starts_at as startsAt, ends_at as endsAt,
 contact, cover_image_key as coverImageKey, featured, published, active, deleted_at as deletedAt,
 created_at as createdAt, updated_at as updatedAt`;
const now = () => new Date().toISOString();
const present = (row: Record<string, unknown>) => {
  const { coverImageKey: _coverImageKey, id, ...event } = row;
  return { id, ...event, coverImageUrl: _coverImageKey ? `/api/media/events/${id}/cover` : null };
};

export class EventRepository {
  constructor(private readonly db: D1Database) {}
  async create(input: EventInput) {
    const id = crypto.randomUUID();
    const timestamp = now();
    await this.db
      .prepare(
        'INSERT INTO events (id, slug, title, summary, description, full_description, location, starts_at, ends_at, contact, cover_image_key, featured, published, active, deleted_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      )
      .bind(
        id,
        input.slug,
        input.title,
        input.summary ?? null,
        input.description,
        input.fullDescription ?? null,
        input.location ?? null,
        input.startsAt,
        input.endsAt ?? null,
        input.contact ?? null,
        null,
        Number(input.featured),
        Number(input.published),
        Number(input.active),
        null,
        timestamp,
        timestamp,
      )
      .run();
    return this.byId(id, true);
  }
  async update(id: string, input: EventInput) {
    await this.byId(id, true);
    const timestamp = now();
    await this.db
      .prepare(
        'UPDATE events SET slug = ?, title = ?, summary = ?, description = ?, full_description = ?, location = ?, starts_at = ?, ends_at = ?, contact = ?, featured = ?, published = ?, active = ?, updated_at = ? WHERE id = ?',
      )
      .bind(
        input.slug,
        input.title,
        input.summary ?? null,
        input.description,
        input.fullDescription ?? null,
        input.location ?? null,
        input.startsAt,
        input.endsAt ?? null,
        input.contact ?? null,
        Number(input.featured),
        Number(input.published),
        Number(input.active),
        timestamp,
        id,
      )
      .run();
    return this.byId(id, true);
  }
  async updateFlag(id: string, column: 'published' | 'active', value: boolean) {
    await this.byId(id, true);
    await this.db
      .prepare(`UPDATE events SET ${column} = ?, updated_at = ? WHERE id = ?`)
      .bind(Number(value), now(), id)
      .run();
    return this.byId(id, true);
  }
  async softDelete(id: string) {
    await this.byId(id, true);
    const timestamp = now();
    await this.db
      .prepare('UPDATE events SET active = 0, deleted_at = ?, updated_at = ? WHERE id = ?')
      .bind(timestamp, timestamp, id)
      .run();
  }
  async byId(id: string, admin = false) {
    const row = await this.db
      .prepare(
        `SELECT ${columns} FROM events WHERE id = ? ${admin ? '' : 'AND active = 1 AND published = 1 AND deleted_at IS NULL'}`,
      )
      .bind(id)
      .first();
    if (!row) throw notFound('Event');
    return present(row as Record<string, unknown>);
  }
  async bySlug(slug: string) {
    const row = await this.db
      .prepare(
        `SELECT ${columns} FROM events WHERE slug = ? AND active = 1 AND published = 1 AND deleted_at IS NULL`,
      )
      .bind(slug)
      .first();
    if (!row) throw notFound('Event');
    return present(row as Record<string, unknown>);
  }
  async list(query: EventListQuery, admin = false) {
    const values: unknown[] = [];
    const conditions = admin
      ? ['deleted_at IS NULL']
      : ['active = 1', 'published = 1', 'deleted_at IS NULL'];
    if (query.future !== undefined) {
      conditions.push(query.future ? 'starts_at >= ?' : 'starts_at < ?');
      values.push(now());
    }
    if (query.featured !== undefined) {
      conditions.push('featured = ?');
      values.push(Number(query.featured));
    }
    const where = conditions.join(' AND ');
    const total = await this.db
      .prepare(`SELECT count(*) as total FROM events WHERE ${where}`)
      .bind(...values)
      .first<{ total: number }>();
    const rows = await this.db
      .prepare(
        `SELECT ${columns} FROM events WHERE ${where} ORDER BY starts_at ${query.direction.toUpperCase()}, id ASC LIMIT ? OFFSET ?`,
      )
      .bind(...values, query.pageSize, (query.page - 1) * query.pageSize)
      .all();
    return {
      items: rows.results.map((row) => present(row as Record<string, unknown>)),
      total: total?.total ?? 0,
    };
  }
  async coverObject(eventId: string, publicOnly = true) {
    const where = publicOnly ? 'AND active = 1 AND published = 1 AND deleted_at IS NULL' : '';
    return this.db
      .prepare(`SELECT cover_image_key as objectKey FROM events WHERE id = ? ${where}`)
      .bind(eventId)
      .first<{ objectKey: string | null }>();
  }
  async setCoverImage(eventId: string, objectKey: string | null) {
    await this.byId(eventId, true);
    await this.db
      .prepare('UPDATE events SET cover_image_key = ?, updated_at = ? WHERE id = ?')
      .bind(objectKey, now(), eventId)
      .run();
    return this.byId(eventId, true);
  }
}
