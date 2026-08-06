import { Hono } from 'hono';
import { describe, expect, it } from 'vitest';
import { AppError } from '../../src/shared/errors/app-error';
import type { UserRecord } from '../../src/modules/users/infrastructure/user-repository';
import {
  requireRole,
  type UserAccessEnvironment,
} from '../../src/modules/users/presentation/user-middleware';

function protectedApp(role: UserRecord['role']) {
  const app = new Hono<UserAccessEnvironment>();
  app.use('*', async (c, next) => {
    c.set('currentUser', { role } as UserRecord);
    await next();
  });
  app.onError((error, c) =>
    error instanceof AppError
      ? new Response(JSON.stringify({ error: error.code }), {
          status: error.status,
          headers: { 'Content-Type': 'application/json; charset=UTF-8' },
        })
      : c.text('error', 500),
  );
  app.get('/config', requireRole('super_admin'), (c) => c.text('ok'));
  return app;
}

describe('administrative role middleware', () => {
  it('blocks an administrator from super-admin-only configuration', async () => {
    const response = await protectedApp('admin').request('https://example.test/config');

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({ error: 'INSUFFICIENT_ACCESS' });
  });

  it('allows a super administrator to edit configuration', async () => {
    const response = await protectedApp('super_admin').request('https://example.test/config');

    expect(response.status).toBe(200);
    await expect(response.text()).resolves.toBe('ok');
  });
});
