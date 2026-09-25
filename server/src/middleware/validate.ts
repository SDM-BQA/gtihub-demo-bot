import type { RequestHandler } from 'express';
import type { ZodType } from 'zod';
import { HttpError } from '../utils/httpError.js';

// Validates and cleans req.body with a zod schema. Controllers only ever see valid data.
export const validateBody =
  (schema: ZodType): RequestHandler =>
  (req, _res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      throw new HttpError(400, result.error.issues.map((i) => i.message).join('; '));
    }
    req.body = result.data;
    next();
  };
