import { describe, expect, it } from 'vitest';
import { userProfileSchema, userRoleInputSchema } from '../../src/modules/users/domain/user';

describe('user access validation', () => {
  it('accepts the three persisted access roles', () => {
    expect(userRoleInputSchema.parse({ role: 'member' }).role).toBe('member');
    expect(userRoleInputSchema.parse({ role: 'admin' }).role).toBe('admin');
    expect(userRoleInputSchema.parse({ role: 'super_admin' }).role).toBe('super_admin');
  });

  it('rejects a guest role because visitors are not persisted users', () => {
    expect(() => userRoleInputSchema.parse({ role: 'guest' })).toThrow();
  });

  it('requires a display name while allowing optional profile contact details', () => {
    expect(
      userProfileSchema.parse({ displayName: 'Ana', phone: null, city: 'São Paulo' }),
    ).toMatchObject({ displayName: 'Ana', phone: null, city: 'São Paulo' });
    expect(() => userProfileSchema.parse({ displayName: ' ', phone: null, city: null })).toThrow();
  });
});
