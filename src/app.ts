import { Hono } from 'hono';
import { getEnv } from './env';
import {
  eventFlagSchema,
  eventInputSchema,
  eventListQuerySchema,
} from './modules/events/domain/event';
import { EventRepository } from './modules/events/infrastructure/event-repository';
import {
  availabilityInputSchema,
  flagInputSchema,
  gameInputSchema,
  gameListQuerySchema,
} from './modules/games/domain/game';
import { GameRepository } from './modules/games/infrastructure/game-repository';
import { adminMediaRoutes, publicMediaRoutes } from './modules/media/presentation/media-routes';
import { siteConfigSchema } from './modules/site-config/domain/site-config';
import { SiteConfigRepository } from './modules/site-config/infrastructure/site-config-repository';
import { toPublicSiteConfig } from './modules/site-config/presentation/site-config-response';
import {
  userProfileSchema,
  userRoleInputSchema,
  userSearchQuerySchema,
} from './modules/users/domain/user';
import { UserRepository } from './modules/users/infrastructure/user-repository';
import {
  loadCurrentUser,
  requireRole,
  type UserAccessEnvironment,
} from './modules/users/presentation/user-middleware';
import { AppError } from './shared/errors/app-error';
import { restrictedCors } from './shared/http/cors';
import { data, paginated } from './shared/http/response';
import { accessMiddleware } from './shared/security/access';
import { idSchema, parseOrThrow, slugSchema } from './shared/validation/common';

function bodyOrThrow(c: { req: { json: () => Promise<unknown> } }) {
  return c.req.json().catch(() => {
    throw new AppError('INVALID_JSON', 400, 'The request body must be valid JSON.');
  });
}

export function createApp() {
  const app = new Hono<UserAccessEnvironment>();
  app.use('*', async (c, next) => {
    getEnv(c.env);
    await next();
  });
  app.use('/api/*', restrictedCors);
  app.onError((error, c) => {
    if (error instanceof AppError)
      return new Response(
        JSON.stringify({
          error: { code: error.code, message: error.message, details: error.details },
        }),
        { status: error.status, headers: { 'Content-Type': 'application/json; charset=UTF-8' } },
      );
    if (error instanceof Error && error.message.includes('UNIQUE constraint failed: games.slug'))
      return new Response(
        JSON.stringify({
          error: {
            code: 'SLUG_ALREADY_EXISTS',
            message: 'The slug is already in use.',
            details: [],
          },
        }),
        { status: 409, headers: { 'Content-Type': 'application/json; charset=UTF-8' } },
      );
    if (error instanceof Error && error.message.includes('UNIQUE constraint failed: events.slug'))
      return new Response(
        JSON.stringify({
          error: {
            code: 'SLUG_ALREADY_EXISTS',
            message: 'The slug is already in use.',
            details: [],
          },
        }),
        { status: 409, headers: { 'Content-Type': 'application/json; charset=UTF-8' } },
      );
    console.error('Unhandled request error', { path: c.req.path, method: c.req.method });
    return c.json(
      { error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.', details: [] } },
      500,
    );
  });
  app.notFound((c) =>
    c.json(
      {
        error: {
          code: 'ROUTE_NOT_FOUND',
          message: 'The requested route was not found.',
          details: [],
        },
      },
      404,
    ),
  );

  app.get('/api/health', (c) => data(c, { status: 'ok' }));
  app.get('/api/games', async (c) => {
    const query = parseOrThrow(gameListQuerySchema, c.req.query());
    const result = await new GameRepository(c.env.DB).list(query);
    return paginated(c, result.items, query.page, query.pageSize, result.total);
  });
  app.get('/api/games/:slug', async (c) =>
    data(
      c,
      await new GameRepository(c.env.DB).bySlug(parseOrThrow(slugSchema, c.req.param('slug'))),
    ),
  );
  app.get('/api/events', async (c) => {
    const query = parseOrThrow(eventListQuerySchema, c.req.query());
    const result = await new EventRepository(c.env.DB).list(query);
    return paginated(c, result.items, query.page, query.pageSize, result.total);
  });
  app.get('/api/events/:slug', async (c) =>
    data(
      c,
      await new EventRepository(c.env.DB).bySlug(parseOrThrow(slugSchema, c.req.param('slug'))),
    ),
  );
  app.get('/api/config/public', async (c) =>
    data(c, toPublicSiteConfig(c.req.url, await new SiteConfigRepository(c.env.DB).get())),
  );
  app.route('/api/media', publicMediaRoutes());

  app.get('/api/account/me', accessMiddleware, loadCurrentUser, (c) =>
    data(c, c.get('currentUser')),
  );
  app.patch('/api/account/me', accessMiddleware, loadCurrentUser, async (c) =>
    data(
      c,
      await new UserRepository(c.env.DB).updateProfile(
        c.get('currentUser').id,
        parseOrThrow(userProfileSchema, await bodyOrThrow(c)),
      ),
    ),
  );

  app.use('/api/admin/*', accessMiddleware, loadCurrentUser, requireRole('admin'));
  app.use('/api/admin/config/public/*', requireRole('super_admin'));
  app.get('/api/admin/users', requireRole('super_admin'), async (c) =>
    data(
      c,
      await new UserRepository(c.env.DB).search(
        parseOrThrow(userSearchQuerySchema, c.req.query()).query,
      ),
    ),
  );
  app.patch('/api/admin/users/:id/role', requireRole('super_admin'), async (c) =>
    data(
      c,
      await new UserRepository(c.env.DB).updateRole(
        c.get('currentUser'),
        parseOrThrow(idSchema, c.req.param('id')),
        parseOrThrow(userRoleInputSchema, await bodyOrThrow(c)).role,
      ),
    ),
  );
  app.get('/api/admin/games', async (c) => {
    const query = parseOrThrow(gameListQuerySchema, c.req.query());
    const result = await new GameRepository(c.env.DB).list(query, true);
    return paginated(c, result.items, query.page, query.pageSize, result.total);
  });
  app.get('/api/admin/games/:id', async (c) =>
    data(
      c,
      await new GameRepository(c.env.DB).byId(parseOrThrow(idSchema, c.req.param('id')), true),
    ),
  );
  app.post('/api/admin/games', async (c) =>
    data(
      c,
      await new GameRepository(c.env.DB).create(
        parseOrThrow(gameInputSchema, await bodyOrThrow(c)),
      ),
      201,
    ),
  );
  app.put('/api/admin/games/:id', async (c) =>
    data(
      c,
      await new GameRepository(c.env.DB).update(
        parseOrThrow(idSchema, c.req.param('id')),
        parseOrThrow(gameInputSchema, await bodyOrThrow(c)),
      ),
    ),
  );
  app.patch('/api/admin/games/:id/availability', async (c) => {
    const body = parseOrThrow(availabilityInputSchema, await bodyOrThrow(c));
    return data(
      c,
      await new GameRepository(c.env.DB).updateAvailability(
        parseOrThrow(idSchema, c.req.param('id')),
        body.availability,
        body.availabilityForecastAt,
      ),
    );
  });
  app.patch('/api/admin/games/:id/publication', async (c) => {
    const body = parseOrThrow(flagInputSchema, await bodyOrThrow(c));
    return data(
      c,
      await new GameRepository(c.env.DB).updateFlag(
        parseOrThrow(idSchema, c.req.param('id')),
        'published',
        body.value,
      ),
    );
  });
  app.patch('/api/admin/games/:id/activity', async (c) => {
    const body = parseOrThrow(flagInputSchema, await bodyOrThrow(c));
    return data(
      c,
      await new GameRepository(c.env.DB).updateFlag(
        parseOrThrow(idSchema, c.req.param('id')),
        'active',
        body.value,
      ),
    );
  });
  app.delete('/api/admin/games/:id', async (c) => {
    await new GameRepository(c.env.DB).softDelete(parseOrThrow(idSchema, c.req.param('id')));
    return c.body(null, 204);
  });
  app.get('/api/admin/events', async (c) => {
    const query = parseOrThrow(eventListQuerySchema, c.req.query());
    const result = await new EventRepository(c.env.DB).list(query, true);
    return paginated(c, result.items, query.page, query.pageSize, result.total);
  });
  app.get('/api/admin/events/:id', async (c) =>
    data(
      c,
      await new EventRepository(c.env.DB).byId(parseOrThrow(idSchema, c.req.param('id')), true),
    ),
  );
  app.post('/api/admin/events', async (c) =>
    data(
      c,
      await new EventRepository(c.env.DB).create(
        parseOrThrow(eventInputSchema, await bodyOrThrow(c)),
      ),
      201,
    ),
  );
  app.put('/api/admin/events/:id', async (c) =>
    data(
      c,
      await new EventRepository(c.env.DB).update(
        parseOrThrow(idSchema, c.req.param('id')),
        parseOrThrow(eventInputSchema, await bodyOrThrow(c)),
      ),
    ),
  );
  app.patch('/api/admin/events/:id/publication', async (c) => {
    const body = parseOrThrow(eventFlagSchema, await bodyOrThrow(c));
    return data(
      c,
      await new EventRepository(c.env.DB).updateFlag(
        parseOrThrow(idSchema, c.req.param('id')),
        'published',
        body.value,
      ),
    );
  });
  app.patch('/api/admin/events/:id/activity', async (c) => {
    const body = parseOrThrow(eventFlagSchema, await bodyOrThrow(c));
    return data(
      c,
      await new EventRepository(c.env.DB).updateFlag(
        parseOrThrow(idSchema, c.req.param('id')),
        'active',
        body.value,
      ),
    );
  });
  app.delete('/api/admin/events/:id', async (c) => {
    await new EventRepository(c.env.DB).softDelete(parseOrThrow(idSchema, c.req.param('id')));
    return c.body(null, 204);
  });

  app.get('/api/admin/config/public', requireRole('super_admin'), async (c) =>
    data(c, toPublicSiteConfig(c.req.url, await new SiteConfigRepository(c.env.DB).get())),
  );
  app.put('/api/admin/config/public', requireRole('super_admin'), async (c) =>
    data(
      c,
      toPublicSiteConfig(
        c.req.url,
        await new SiteConfigRepository(c.env.DB).save(
          parseOrThrow(siteConfigSchema, await bodyOrThrow(c)),
        ),
      ),
    ),
  );
  app.route('/api/admin', adminMediaRoutes());
  return app;
}
