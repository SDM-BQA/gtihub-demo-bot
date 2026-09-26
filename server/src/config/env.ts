import { z } from 'zod';

// Every env var the app reads is declared here. If one is missing or invalid, the app refuses to start
// instead of failing later in the middle of a request.
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  // Public base URL of this app, e.g. https://xyz.onrender.com (http://localhost:5173 in dev). Used for OAuth redirects.
  APP_URL: z.url(),
  DATABASE_URL: z.url(),
  SESSION_SECRET: z.string().min(32),

  // GitHub App (Settings → Developer settings → GitHub Apps)
  GITHUB_APP_ID: z.string().min(1),
  GITHUB_APP_SLUG: z.string().min(1),
  GITHUB_CLIENT_ID: z.string().min(1),
  GITHUB_CLIENT_SECRET: z.string().min(1),
  // The .pem private key, base64-encoded so it fits on one line in .env and in Render.
  GITHUB_PRIVATE_KEY_BASE64: z.string().min(1),
  GITHUB_WEBHOOK_SECRET: z.string().min(20),

  // Slack Incoming Webhook (api.slack.com/apps → your app → Incoming Webhooks). Anyone with this URL can post to the channel.
  SLACK_WEBHOOK_URL: z.url(),

  // Groq (console.groq.com, free tier, no card). Used by the "AI summary" rule action.
  GROQ_API_KEY: z.string().min(1),
  GROQ_MODEL: z.string().default('openai/gpt-oss-20b'),
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
