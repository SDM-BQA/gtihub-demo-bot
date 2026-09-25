import { z } from 'zod';

// Every env var the app reads is declared here. If one is missing or invalid, the app refuses to start
// instead of failing later in the middle of a request.
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  DATABASE_URL: z.url(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // Print only the key names and reasons, never the values (they may be secrets).
  const problems = parsed.error.issues.map((issue) => `  ${issue.path.join('.')}: ${issue.message}`);
  console.error(`Invalid environment variables:\n${problems.join('\n')}`);
  process.exit(1);
}

export const env = parsed.data;
export const isProd = env.NODE_ENV === 'production';
