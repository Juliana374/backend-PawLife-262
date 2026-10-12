import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

export function getUploadDirectory() {
  return resolve(process.env.UPLOADS_DIR || 'uploads');
}

export function ensureUploadDirectory() {
  const directory = getUploadDirectory();
  mkdirSync(directory, { recursive: true });
  return directory;
}