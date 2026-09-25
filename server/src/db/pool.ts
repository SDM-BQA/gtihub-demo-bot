import pg from 'pg';
import { env } from '../config/env.js';

// One Postgres connection pool, shared by Prisma and the session store.
export const pool = new pg.Pool({ connectionString: env.DATABASE_URL, max: 5 });
