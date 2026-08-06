import { unlink, writeFile } from 'node:fs/promises';
import { Buffer } from 'node:buffer';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import jsonServer from 'json-server';

const maximumSvgBytes = 8 * 1024 * 1024;
const maximumRequestBytes = maximumSvgBytes + 128 * 1024;
const assetNames = new Set(['logo', 'icon']);
const assetFilenames = { logo: 'logo.svg', icon: 'ico.svg' };

const directory = dirname(fileURLToPath(import.meta.url));
const root = resolve(directory, '..');
const databasePath = resolve(root, '.local/db.json');
const uploadsDirectory = resolve(root, '.local/uploads');
const apiOrigin = 'http://localhost:3000';
const port = 3000;

const server = jsonServer.create();
const router = jsonServer.router(databasePath);

function sendError(response, status, code, message) {
  response.status(status).json({ error: { code, message } });
}

function readRequestBody(request) {
  const contentLength = Number(request.headers['content-length'] ?? 0);
  if (Number.isFinite(contentLength) && contentLength > maximumRequestBytes) {
    request.resume();
    return Promise.reject(new Error('REQUEST_TOO_LARGE'));
  }

  return new Promise((resolveBody, rejectBody) => {
    const chunks = [];
    let size = 0;
    let exceededLimit = false;

    request.on('data', (chunk) => {
      if (exceededLimit) return;
      size += chunk.length;
      if (size > maximumRequestBytes) {
        exceededLimit = true;
        request.resume();
        rejectBody(new Error('REQUEST_TOO_LARGE'));
        return;
      }
      chunks.push(chunk);
    });
    request.on('end', () => {
      if (!exceededLimit) resolveBody(Buffer.concat(chunks));
    });
    request.on('error', rejectBody);
  });
}

async function readSvgUpload(request) {
  const contentType = request.headers['content-type'];
  if (typeof contentType !== 'string' || !contentType.startsWith('multipart/form-data;')) {
    throw new Error('INVALID_MULTIPART');
  }

  const body = await readRequestBody(request);
  let form;
  try {
    form = await new globalThis.Response(body, {
      headers: { 'content-type': contentType },
    }).formData();
  } catch {
    throw new Error('INVALID_MULTIPART');
  }

  const file = form.get('file');
  if (
    file === null ||
    typeof file !== 'object' ||
    typeof file.arrayBuffer !== 'function' ||
    typeof file.type !== 'string' ||
    typeof file.size !== 'number'
  ) {
    throw new Error('FILE_REQUIRED');
  }
  if (file.type !== 'image/svg+xml') throw new Error('INVALID_IMAGE_MIME_TYPE');
  if (file.size === 0 || file.size > maximumSvgBytes) throw new Error('IMAGE_TOO_LARGE');
  return new Uint8Array(await file.arrayBuffer());
}

function config() {
  const value = router.db.get('siteConfig').value();
  if (!value || typeof value !== 'object') throw new Error('SITE_CONFIG_MISSING');
  return value;
}

function saveConfig(value) {
  router.db.set('siteConfig', value).write();
}

server.use(jsonServer.defaults({ bodyParser: true }));

server.get('/dev-assets/:filename', (request, response) => {
  const filename = request.params.filename;
  if (!Object.values(assetFilenames).includes(filename)) {
    sendError(response, 404, 'NOT_FOUND', 'Arquivo não encontrado.');
    return;
  }

  response.set({ 'Cache-Control': 'no-store', 'Content-Type': 'image/svg+xml' });
  response.sendFile(resolve(uploadsDirectory, filename), (error) => {
    if (error && !response.headersSent) {
      sendError(response, 404, 'NOT_FOUND', 'Arquivo não encontrado.');
    }
  });
});

server.put('/siteConfig', (request, response) => {
  if (!request.body || typeof request.body !== 'object' || Array.isArray(request.body)) {
    sendError(response, 400, 'VALIDATION_ERROR', 'As configurações do site são obrigatórias.');
    return;
  }

  const input = { ...request.body };
  delete input.iconUrl;
  delete input.logoUrl;
  const next = { ...config(), ...input };
  saveConfig(next);
  response.json(next);
});

server.post('/siteConfig/:asset', async (request, response) => {
  const asset = request.params.asset;
  if (!assetNames.has(asset)) {
    sendError(response, 404, 'NOT_FOUND', 'Arquivo não encontrado.');
    return;
  }

  try {
    const content = await readSvgUpload(request);
    const filename = assetFilenames[asset];
    const path = resolve(uploadsDirectory, filename);
    await writeFile(path, content);
    try {
      const current = config();
      const key = `${asset}Url`;
      const next = { ...current, [key]: `${apiOrigin}/dev-assets/${filename}?v=${Date.now()}` };
      saveConfig(next);
      response.status(201).json(next);
    } catch (error) {
      await unlink(path).catch(() => undefined);
      throw error;
    }
  } catch (error) {
    const code = error instanceof Error ? error.message : 'UPLOAD_FAILED';
    const status =
      code === 'INVALID_IMAGE_MIME_TYPE' ||
      code === 'IMAGE_TOO_LARGE' ||
      code === 'REQUEST_TOO_LARGE'
        ? 422
        : code === 'UPLOAD_FAILED'
          ? 500
          : 400;
    sendError(response, status, code, 'Não foi possível enviar o SVG.');
  }
});

server.delete('/siteConfig/:asset', async (request, response) => {
  const asset = request.params.asset;
  if (!assetNames.has(asset)) {
    sendError(response, 404, 'NOT_FOUND', 'Arquivo não encontrado.');
    return;
  }

  try {
    const current = config();
    const key = `${asset}Url`;
    if (!current[key]) {
      sendError(response, 404, 'NOT_FOUND', 'Arquivo não encontrado.');
      return;
    }
    await unlink(resolve(uploadsDirectory, assetFilenames[asset]));
    const next = { ...current, [key]: null };
    saveConfig(next);
    response.json(next);
  } catch {
    sendError(response, 500, 'DELETE_FAILED', 'Não foi possível remover o SVG.');
  }
});

server.use(router);

server.listen(port, () => {
  console.log(`API de desenvolvimento em ${apiOrigin}`);
});
