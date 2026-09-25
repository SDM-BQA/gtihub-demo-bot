import type { ErrorRequestHandler, RequestHandler } from 'express';
import { HttpError } from '../utils/httpError.js';

export const notFound: RequestHandler = (_req, _res, next) => {
  next(new HttpError(404, 'Not found'));
};

// Express 5 forwards errors thrown in async handlers here automatically, so no try/catch in controllers.
export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  const status = err instanceof HttpError ? err.status : 500;

  if (status >= 500) req.log.error({ err }, 'unhandled error');

  // Never leak internal error details (stack traces, SQL, tokens) to the client.
  const message = status >= 500 ? 'Internal server error' : err.message;
  res.status(status).json({ error: message });
};
