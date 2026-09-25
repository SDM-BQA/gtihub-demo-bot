import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import { env, isProd } from '../config/env.js';
import { pool } from '../db/pool.js';

const PgStore = connectPgSimple(session);

export const sessionMiddleware = session({
  store: new PgStore({
    pool,
    tableName: 'session', // created by the Prisma migration
    // Built-in pruning queries the DB every 15 min, which would stop Neon from ever sleeping.
    // Expired sessions are pruned on login instead (see auth.service).
    pruneSessionInterval: false,
  }),
  name: 'sid',
  secret: env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true, // not readable from JavaScript
    secure: isProd, // HTTPS only in production
    sameSite: 'lax', // not sent on cross-site POSTs (basic CSRF protection); still sent on the redirect back from GitHub
    maxAge: 7 * 24 * 60 * 60 * 1000,
  },
});
