import { randomBytes, timingSafeEqual } from 'node:crypto';
import type { Request } from 'express';

// Promise versions of express-session's callback APIs.
export const regenerateSession = (req: Request) =>
  new Promise<void>((resolve, reject) => req.session.regenerate((err) => (err ? reject(err) : resolve())));

export const destroySession = (req: Request) =>
  new Promise<void>((resolve, reject) => req.session.destroy((err) => (err ? reject(err) : resolve())));

// OAuth "state": a random value we remember in the session and expect GitHub to send back.
// It proves the callback belongs to a login this browser started (stops login CSRF).
export function createOAuthState(req: Request): string {
  const state = randomBytes(16).toString('hex');
  req.session.oauthState = state;
  return state;
}

export function consumeOAuthState(req: Request, received: unknown): boolean {
  const expected = req.session.oauthState;
  delete req.session.oauthState; // one-time use
  if (typeof received !== 'string' || !expected || received.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(received), Buffer.from(expected));
}
