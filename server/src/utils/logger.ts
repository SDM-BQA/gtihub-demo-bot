import { pino } from 'pino';
import { env, isProd } from '../config/env.js';

// Structured JSON logs in production (readable in Render's log viewer), pretty output in dev.
export const logger = pino({
  level: env.LOG_LEVEL,
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'req.headers["x-hub-signature-256"]',
      'res.headers["set-cookie"]',
      '*.token',
      '*.accessToken',
      '*.secret',
      '*.webhookUrl',
    ],
    censor: '[redacted]',
  },
  transport: isProd ? undefined : { target: 'pino-pretty', options: { colorize: true } },
});
