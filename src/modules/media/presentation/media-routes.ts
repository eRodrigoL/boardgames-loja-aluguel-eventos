import { Hono } from 'hono';
import type { Env } from '../../../env';
import { getEnv } from '../../../env';
import { AppError, notFound } from '../../../shared/errors/app-error';
import { data } from '../../../shared/http/response';
import { idSchema, parseOrThrow } from '../../../shared/validation/common';
import { GameRepository } from '../../games/infrastructure/game-repository';
import { EventRepository } from '../../events/infrastructure/event-repository';

const supportedTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);

export function detectImageType(bytes: Uint8Array): string | undefined {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff)
    return 'image/jpeg';
  if (bytes.length >= 8 && String.fromCharCode(...bytes.slice(0, 8)) === '\x89PNG\r\n\x1a\n')
    return 'image/png';
  if (
    bytes.length >= 12 &&
    String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' &&
    String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP'
  )
    return 'image/webp';
  return undefined;
}

export function publicMediaRoutes() {
  const app = new Hono<{ Bindings: Env }>();
  app.get('/images/:imageId', async (c) => {
    const imageId = parseOrThrow(idSchema, c.req.param('imageId'));
    const image = await new GameRepository(c.env.DB).imageRecord(imageId);
    if (!image || !image.active || !image.published || image.deletedAt) throw notFound('Image');
    const object = await c.env.MEDIA.get(image.objectKey);
    if (!object) throw notFound('Image');
    return new Response(object.body, {
      headers: {
        'Content-Type': image.mimeType,
        'Cache-Control': 'public, max-age=3600',
        ETag: object.httpEtag,
      },
    });
  });
  app.get('/events/:eventId/cover', async (c) => {
    const eventId = parseOrThrow(idSchema, c.req.param('eventId'));
    const cover = await new EventRepository(c.env.DB).coverObject(eventId);
    if (!cover?.objectKey) throw notFound('Event cover image');
    const object = await c.env.MEDIA.get(cover.objectKey);
    if (!object) throw notFound('Event cover image');
    return new Response(object.body, {
      headers: {
        'Content-Type': object.httpMetadata?.contentType ?? 'application/octet-stream',
        'Cache-Control': 'public, max-age=3600',
        ETag: object.httpEtag,
      },
    });
  });
  return app;
}

export function adminMediaRoutes() {
  const app = new Hono<{ Bindings: Env }>();
  app.post('/games/:gameId/images', async (c) => {
    const gameId = parseOrThrow(idSchema, c.req.param('gameId'));
    const form = await c.req.formData();
    const candidate = form.get('file');
    if (!(candidate instanceof File))
      throw new AppError('VALIDATION_ERROR', 400, 'A file is required.', [{ path: ['file'] }]);
    if (!supportedTypes.has(candidate.type))
      throw new AppError(
        'INVALID_IMAGE_MIME_TYPE',
        422,
        'Only JPEG, PNG, and WebP files are allowed.',
      );
    if (candidate.size === 0 || candidate.size > getEnv(c.env).MAX_IMAGE_BYTES)
      throw new AppError('IMAGE_TOO_LARGE', 422, 'The image exceeds the allowed size.');
    const content = await candidate.arrayBuffer();
    const detected = detectImageType(new Uint8Array(content));
    if (!detected)
      throw new AppError('INVALID_IMAGE_FORMAT', 422, 'The file content is not a supported image.');
    if (detected !== candidate.type)
      throw new AppError(
        'IMAGE_MIME_MISMATCH',
        422,
        'The declared MIME type does not match the file content.',
      );
    const imageId = crypto.randomUUID();
    const objectKey = `games/${gameId}/${crypto.randomUUID()}`;
    await c.env.MEDIA.put(objectKey, content, { httpMetadata: { contentType: detected } });
    try {
      const game = await new GameRepository(c.env.DB).addImage(gameId, {
        id: imageId,
        objectKey,
        mimeType: detected,
        sizeBytes: candidate.size,
        altText:
          typeof form.get('altText') === 'string'
            ? String(form.get('altText')).trim().slice(0, 500) || null
            : null,
      });
      return data(c, game, 201);
    } catch (error) {
      await c.env.MEDIA.delete(objectKey).catch(() => undefined);
      throw error;
    }
  });
  app.delete('/games/:gameId/images/:imageId', async (c) => {
    const gameId = parseOrThrow(idSchema, c.req.param('gameId'));
    const imageId = parseOrThrow(idSchema, c.req.param('imageId'));
    const repository = new GameRepository(c.env.DB);
    const image = await repository.imageRecord(imageId);
    if (!image || image.gameId !== gameId) throw notFound('Image');
    try {
      await c.env.MEDIA.delete(image.objectKey);
    } catch {
      throw new AppError('MEDIA_DELETE_FAILED', 502, 'The image could not be removed safely.');
    }
    await repository.deleteImage(gameId, imageId);
    return c.body(null, 204);
  });
  app.patch('/games/:gameId/images/order', async (c) => {
    const gameId = parseOrThrow(idSchema, c.req.param('gameId'));
    const body = await c.req.json().catch(() => ({}));
    if (
      !body ||
      typeof body !== 'object' ||
      !Array.isArray((body as { imageIds?: unknown }).imageIds)
    )
      throw new AppError('VALIDATION_ERROR', 400, 'imageIds must be an array.');
    const imageIds = (body as { imageIds: unknown[] }).imageIds.map((value) =>
      parseOrThrow(idSchema, value),
    );
    return data(c, await new GameRepository(c.env.DB).reorderImages(gameId, imageIds));
  });
  app.post('/events/:eventId/cover', async (c) => {
    const eventId = parseOrThrow(idSchema, c.req.param('eventId'));
    const form = await c.req.formData();
    const candidate = form.get('file');
    if (!(candidate instanceof File))
      throw new AppError('VALIDATION_ERROR', 400, 'A file is required.', [{ path: ['file'] }]);
    if (!supportedTypes.has(candidate.type))
      throw new AppError(
        'INVALID_IMAGE_MIME_TYPE',
        422,
        'Only JPEG, PNG, and WebP files are allowed.',
      );
    if (candidate.size === 0 || candidate.size > getEnv(c.env).MAX_IMAGE_BYTES)
      throw new AppError('IMAGE_TOO_LARGE', 422, 'The image exceeds the allowed size.');
    const content = await candidate.arrayBuffer();
    const detected = detectImageType(new Uint8Array(content));
    if (!detected || detected !== candidate.type)
      throw new AppError(
        'INVALID_IMAGE_FORMAT',
        422,
        'The file content is not a valid image of the declared type.',
      );
    const repository = new EventRepository(c.env.DB);
    const previous = await repository.coverObject(eventId, false);
    const objectKey = `events/${eventId}/${crypto.randomUUID()}`;
    await c.env.MEDIA.put(objectKey, content, { httpMetadata: { contentType: detected } });
    try {
      const event = await repository.setCoverImage(eventId, objectKey);
      if (previous?.objectKey) await c.env.MEDIA.delete(previous.objectKey).catch(() => undefined);
      return data(c, event, 201);
    } catch (error) {
      await c.env.MEDIA.delete(objectKey).catch(() => undefined);
      throw error;
    }
  });
  app.delete('/events/:eventId/cover', async (c) => {
    const eventId = parseOrThrow(idSchema, c.req.param('eventId'));
    const repository = new EventRepository(c.env.DB);
    const cover = await repository.coverObject(eventId, false);
    if (!cover?.objectKey) throw notFound('Event cover image');
    try {
      await c.env.MEDIA.delete(cover.objectKey);
    } catch {
      throw new AppError('MEDIA_DELETE_FAILED', 502, 'The image could not be removed safely.');
    }
    await repository.setCoverImage(eventId, null);
    return c.body(null, 204);
  });
  return app;
}
