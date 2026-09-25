import { createHmac, timingSafeEqual } from 'node:crypto';
import type { RequestHandler } from 'express';
import { env } from '../config/env.js';
import { HttpError } from '../utils/httpError.js';

// GitHub signs every webhook: X-Hub-Signature-256 = "sha256=" + HMAC-SHA256(webhook secret, raw body).
// We recompute it over the exact raw bytes (so this must run after express.raw, never after express.json)
// and compare in constant time, so an attacker can't guess the signature byte by byte from response timings.
export const verifyGithubSignature: RequestHandler = (req, _res, next) => {
  const received = req.header('x-hub-signature-256');
  if (!received || !Buffer.isBuffer(req.body)) throw new HttpError(401, 'Missing signature');

  const expected = `sha256=${createHmac('sha256', env.GITHUB_WEBHOOK_SECRET).update(req.body).digest('hex')}`;
  const a = Buffer.from(received);
  const b = Buffer.from(expected);

  if (a.length !== b.length || !timingSafeEqual(a, b)) throw new HttpError(401, 'Invalid signature');
  next();
};
