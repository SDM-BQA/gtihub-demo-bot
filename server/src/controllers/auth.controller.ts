import type { Request, Response } from 'express';
import { githubApp, installUrl, oauthCallbackUrl } from '../github/app.js';
import { signInWithCode } from '../services/auth.service.js';
import { consumeOAuthState, createOAuthState, destroySession, regenerateSession } from '../utils/session.js';
import { HttpError } from '../utils/httpError.js';

export function login(req: Request, res: Response) {
  const state = createOAuthState(req);
  const { url } = githubApp.oauth.getWebFlowAuthorizationUrl({ state, redirectUrl: oauthCallbackUrl });
  res.redirect(url);
}

// Sends the user to GitHub's "install app / pick repositories" page. GitHub then redirects to the same callback as login.
export function install(req: Request, res: Response) {
  const state = createOAuthState(req);
  res.redirect(`${installUrl}?state=${state}`);
}

export async function callback(req: Request, res: Response) {
  // User clicked "Cancel" on GitHub.
  if (req.query.error) return res.redirect('/');

  if (!consumeOAuthState(req, req.query.state)) throw new HttpError(400, 'Invalid or expired login attempt, please try again');
  if (typeof req.query.code !== 'string') throw new HttpError(400, 'Missing OAuth code');

  const user = await signInWithCode(req.query.code);

  // New session ID after login, so a session ID planted before login can't be reused (session fixation).
  await regenerateSession(req);
  req.session.userId = user.id;
  res.redirect('/');
}

export async function logout(req: Request, res: Response) {
  await destroySession(req);
  res.clearCookie('sid');
  res.status(204).end();
}
