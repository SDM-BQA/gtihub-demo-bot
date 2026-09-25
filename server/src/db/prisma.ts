import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.js';
import { pool } from './pool.js';

// One shared client for the whole app.
export const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
