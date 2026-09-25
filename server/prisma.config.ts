import { existsSync } from 'node:fs';
import { defineConfig, env } from 'prisma/config';

// Prisma 7 no longer reads .env on its own. Locally we load it; on Render the vars come from the dashboard.
if (existsSync('../.env')) process.loadEnvFile('../.env');

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  // Migrations use Neon's DIRECT (non-pooled) connection; the app itself uses the pooled DATABASE_URL.
  datasource: { url: env('DIRECT_URL') },
});
