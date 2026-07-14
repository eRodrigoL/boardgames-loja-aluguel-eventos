import { describe, expect, it } from 'vitest';
import { gameInputSchema, gameListQuerySchema } from '../../src/modules/games/domain/game';

const validGame = {
  slug: 'wingspan',
  name: 'Wingspan',
  availability: 'available',
  tags: ['Engine building'],
};

describe('game validation', () => {
  it('accepts a valid draft game and normalizes defaults', () => {
    const game = gameInputSchema.parse(validGame);
    expect(game.published).toBe(false);
    expect(game.active).toBe(true);
    expect(game.weeklyRentalPriceCents).toBeUndefined();
  });
  it.each([
    [{ ...validGame, name: '' }],
    [{ ...validGame, minPlayers: 0 }],
    [{ ...validGame, minPlayers: 4, maxPlayers: 3 }],
    [{ ...validGame, weeklyRentalPriceCents: -1 }],
    [{ ...validGame, boxWidthMm: 0 }],
    [{ ...validGame, boxWeightGrams: 0 }],
  ])('rejects invalid game values', (input) =>
    expect(gameInputSchema.safeParse(input).success).toBe(false),
  );
  it('limits list pagination and accepts only known ordering', () => {
    expect(
      gameListQuerySchema.parse({ page: '2', pageSize: '50', order: 'price', direction: 'desc' }),
    ).toMatchObject({ page: 2, pageSize: 50, order: 'price' });
    expect(gameListQuerySchema.safeParse({ pageSize: '51' }).success).toBe(false);
    expect(gameListQuerySchema.safeParse({ order: 'unsafe_sql' }).success).toBe(false);
  });
});
