import type { RequestHandler } from 'express';
import { HttpError } from '../utils/httpError.js';

export const requireAuth: RequestHandler = (req, _res, next) => {
  if (!req.session.userId) throw new HttpError(401, 'Not signed in');
  next();
};
