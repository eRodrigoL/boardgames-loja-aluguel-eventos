import type { MiddlewareHandler } from 'hono';
import type { Env } from '../../env';

export const restrictedCors: MiddlewareHandler<{ Bindings: Env }> = async (c, next) => {
  const origin = c.req.header('Origin');
  const allowedOrigins = c.env.PUBLIC_ORIGINS.split(',').map((value) => value.trim());
  const allowed = origin && allowedOrigins.includes(origin);
  if (c.req.method === 'OPTIONS') {
    if (!allowed) return c.body(null, 403);
    return new Response(null, { status: 204, headers: corsHeaders(origin) });
  }
  await next();
  if (allowed) for (const [key, value] of Object.entries(corsHeaders(origin))) c.header(key, value);
};

function corsHeaders(origin: string) {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}
