import { describe, expect, it } from 'vitest';
import {
  gameInputSchema,
  gameListQuerySchema,
  generateGameSlug,
} from '../../src/modules/games/domain/game';

const validGame = {
  name: 'Wingspan',
  publisher: 'Stonemaier Games',
  editionReleaseYear: 2019,
  availability: 'available',
  tags: ['Engine building'],
};

describe('game validation', () => {
  it('accepts a valid draft game and normalizes defaults', () => {
    const game = gameInputSchema.parse(validGame);
    expect(game.published).toBe(false);
    expect(game.active).toBe(true);
    expect(game.weeklyRentalPriceCents).toBeUndefined();
    expect(game.slug).toBe('wingspan-2019-stonemaier-games');
  });
  it('uses an explicitly supplied slug for kits and accessories', () => {
    expect(
      gameInputSchema.parse({
        name: 'Kit de jogos para festa',
        slug: 'kit-festa-infantil',
        availability: 'available',
      }),
    ).toMatchObject({ slug: 'kit-festa-infantil' });
  });
  it('requires edition metadata when no slug override is supplied', () => {
    expect(gameInputSchema.safeParse({ name: 'Wingspan', availability: 'available' }).success).toBe(
      false,
    );
  });
  it('normalizes the generated slug from the name and publisher', () => {
    expect(generateGameSlug('Açúcar & Dados', 2024, 'Editora São João')).toBe(
      'acucar-dados-2024-editora-sao-joao',
    );
  });
  it.each([
    [{ ...validGame, name: '' }],
    [{ ...validGame, minPlayers: 0 }],
    [{ ...validGame, minPlayers: 4, maxPlayers: 3 }],
    [{ ...validGame, weeklyRentalPriceCents: -1 }],
    [{ ...validGame, salePriceCents: -1 }],
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
  it('accepts independent sale and rental availability', () => {
    expect(
      gameInputSchema.parse({ ...validGame, availableForSale: true, availableForRental: false }),
    ).toMatchObject({ availableForSale: true, availableForRental: false });
  });
});
