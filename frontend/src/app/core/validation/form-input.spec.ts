import { describe, expect, it } from 'vitest';
import { normalizeInteger, normalizeSlug, normalizeText } from './form-input';

describe('form input normalization', () => {
  it('converts spaces and unsafe punctuation in a slug to one hyphen', () => {
    expect(normalizeSlug('  A Coroa!   de   Cinzas  ')).toBe('a-coroa-de-cinzas');
  });

  it('removes control characters and applies the configured text length', () => {
    expect(normalizeText('Mesa\u0000 aberta', 12)).toBe('Mesa aberta');
  });

  it('keeps numeric fields in their supported range', () => {
    expect(normalizeInteger('150', 1, 100)).toBe(100);
    expect(normalizeInteger('-3', 0, 10)).toBe(0);
  });
});
