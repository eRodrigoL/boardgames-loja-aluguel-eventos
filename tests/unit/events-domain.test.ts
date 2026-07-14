import { describe, expect, it } from 'vitest';
import { eventInputSchema } from '../../src/modules/events/domain/event';

describe('event validation', () => {
  const event = {
    slug: 'noite-de-jogos',
    title: 'Noite de jogos',
    description: 'Traga seus amigos.',
    startsAt: '2026-07-12T18:00:00-03:00',
  };
  it('accepts an event with no end date', () =>
    expect(eventInputSchema.parse(event).endsAt).toBeUndefined());
  it('rejects missing required fields and an end before the start', () => {
    expect(eventInputSchema.safeParse({ ...event, title: '' }).success).toBe(false);
    expect(eventInputSchema.safeParse({ ...event, description: '' }).success).toBe(false);
    expect(
      eventInputSchema.safeParse({ ...event, endsAt: '2026-07-12T17:00:00-03:00' }).success,
    ).toBe(false);
  });
});
