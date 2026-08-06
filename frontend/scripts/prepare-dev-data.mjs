import { copyFile, mkdir, rm } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const directory = dirname(fileURLToPath(import.meta.url));
const root = resolve(directory, '..');
const source = resolve(root, 'src/data/db.seed.json');
const localDirectory = resolve(root, '.local');
const target = resolve(localDirectory, 'db.json');
const uploadsDirectory = resolve(localDirectory, 'uploads');

await rm(uploadsDirectory, { force: true, recursive: true });
await mkdir(uploadsDirectory, { recursive: true });
await copyFile(source, target);
await copyFile(resolve(root, 'public/logo.svg'), resolve(uploadsDirectory, 'logo.svg'));
await copyFile(resolve(root, 'public/ico.svg'), resolve(uploadsDirectory, 'ico.svg'));

console.log('Base e arquivos temporários criados em frontend/.local');
