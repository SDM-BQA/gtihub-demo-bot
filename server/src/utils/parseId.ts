import { HttpError } from './httpError.js';

// Route params arrive as strings; anything that isn't a positive integer is a 404, not a DB error.
export function parseId(value: string | string[] | undefined): number {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) throw new HttpError(404, 'Not found');
  return id;
}
