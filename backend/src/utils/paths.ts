import path from 'node:path';

export const BACKEND_ROOT = path.resolve(__dirname, '..', '..');
export const UPLOADS_DIR = path.join(BACKEND_ROOT, 'uploads');
export const FOTOS_DIR = path.join(UPLOADS_DIR, 'fotos');
