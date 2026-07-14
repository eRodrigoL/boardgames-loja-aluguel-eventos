import { env } from 'cloudflare:test';
import { describe, expect, it } from 'vitest';
import { createApp } from '../../src/app';

describe('HTTP security boundaries', () => {
  it('exposes the health check with the standard envelope', async () => {
    const response = await createApp().request('https://example.test/api/health', undefined, env);
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ data: { status: 'ok' } });
  });
  it('rejects unauthenticated administrative requests', async () => {
    const response = await createApp().request(
      'https://example.test/api/admin/games',
      undefined,
      env,
    );
    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({
      error: { code: 'ADMIN_AUTHENTICATION_REQUIRED' },
    });
  });
  it('does not use a wildcard CORS origin for administrative requests', async () => {
    const response = await createApp().request(
      'https://example.test/api/admin/games',
      { headers: { Origin: 'https://untrusted.example' } },
      env,
    );
    expect(response.headers.get('Access-Control-Allow-Origin')).toBeNull();
  });
});
