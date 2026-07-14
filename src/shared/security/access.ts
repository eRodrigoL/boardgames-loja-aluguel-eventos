import { createRemoteJWKSet, jwtVerify } from 'jose';
import type { MiddlewareHandler } from 'hono';
import type { Env } from '../../env';
import { AppError } from '../errors/app-error';

export async function verifyAccessToken(token: string, env: Env) {
  const jwks = createRemoteJWKSet(new URL(env.ACCESS_JWKS_URL));
  try {
    const verified = await jwtVerify(token, jwks, {
      issuer: env.ACCESS_ISSUER,
      audience: env.ACCESS_AUDIENCE,
      algorithms: ['RS256', 'ES256'],
    });
    if (typeof verified.payload.sub !== 'string' || !verified.payload.sub) {
      throw new Error('Missing subject claim');
    }
    return verified;
  } catch {
    throw new AppError('INVALID_ADMIN_TOKEN', 401, 'A valid administrator token is required.');
  }
}

export const accessMiddleware: MiddlewareHandler<{ Bindings: Env }> = async (c, next) => {
  const authorization = c.req.header('Authorization');
  if (!authorization?.startsWith('Bearer '))
    throw new AppError(
      'ADMIN_AUTHENTICATION_REQUIRED',
      401,
      'Administrator authentication is required.',
    );
  await verifyAccessToken(authorization.slice(7), c.env);
  await next();
};
