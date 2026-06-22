import { KeysetCursor } from '../types/product';

const CURSOR_SEPARATOR = '|';

export function encodeCursor(cursor: KeysetCursor): string {
  const payload = `${cursor.createdAt.toISOString()}${CURSOR_SEPARATOR}${cursor.id}`;
  return Buffer.from(payload, 'utf8').toString('base64url');
}

export function decodeCursor(token: string): KeysetCursor {
  let decoded: string;
  try {
    decoded = Buffer.from(token, 'base64url').toString('utf8');
  } catch {
    throw new Error('Invalid cursor token');
  }

  const separatorIndex = decoded.lastIndexOf(CURSOR_SEPARATOR);
  if (separatorIndex === -1) {
    throw new Error('Invalid cursor payload');
  }

  const createdAtRaw = decoded.slice(0, separatorIndex);
  const idRaw = decoded.slice(separatorIndex + 1);
  const createdAt = new Date(createdAtRaw);
  const id = Number.parseInt(idRaw, 10);

  if (Number.isNaN(createdAt.getTime()) || Number.isNaN(id)) {
    throw new Error('Invalid cursor payload');
  }

  return { createdAt, id };
}
