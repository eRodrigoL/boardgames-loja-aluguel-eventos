import { env } from 'cloudflare:test';
import { beforeEach, describe, expect, it } from 'vitest';
import { gameInputSchema } from '../../src/modules/games/domain/game';
import { GameRepository } from '../../src/modules/games/infrastructure/game-repository';
import { gamesSchema } from '../fixtures/games-schema';

const input = (slug: string, tags = ['Strategy']) =>
  gameInputSchema.parse({ slug, name: slug, availability: 'available', tags });

describe('GameRepository with D1', () => {
  beforeEach(async () => {
    await env.DB.exec(
      'DROP TABLE IF EXISTS game_images; DROP TABLE IF EXISTS game_tags; DROP TABLE IF EXISTS tags; DROP TABLE IF EXISTS games;',
    );
    await env.DB.batch(gamesSchema.map((statement) => env.DB.prepare(statement)));
  });
  it('keeps drafts without images out of the public listing and publishes after an image is added', async () => {
    const repository = new GameRepository(env.DB);
    const draft = await repository.create(input('cascadia'));
    expect(
      (await repository.list({ page: 1, pageSize: 20, order: 'name', direction: 'asc' })).items,
    ).toHaveLength(0);
    await repository.addImage(draft.id, {
      id: crypto.randomUUID(),
      objectKey: 'games/cascadia/one',
      mimeType: 'image/png',
      sizeBytes: 10,
      altText: null,
    });
    await repository.updateFlag(draft.id, 'published', true);
    const listed = await repository.list({
      page: 1,
      pageSize: 20,
      order: 'name',
      direction: 'asc',
    });
    expect(listed.items).toHaveLength(1);
    expect(listed.items[0]?.images[0]?.url).toMatch(/^\/api\/media\/images\//);
  });
  it('normalizes shared tags and removes soft-deleted games from public results', async () => {
    const repository = new GameRepository(env.DB);
    const first = await repository.create(input('azul', ['Strategy']));
    const second = await repository.create(input('brass', [' strategy ']));
    const tags = await env.DB.prepare('SELECT count(*) as total FROM tags').first<{
      total: number;
    }>();
    expect(tags?.total).toBe(1);
    await repository.softDelete(first.id);
    expect((await repository.byId(second.id, true)).tags[0]?.slug).toBe('strategy');
    await expect(repository.bySlug('azul')).rejects.toMatchObject({ code: 'RESOURCE_NOT_FOUND' });
  });
});
