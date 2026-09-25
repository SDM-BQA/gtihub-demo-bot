import { createApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';

const server = createApp().listen(env.PORT, () => {
  logger.info({ port: env.PORT, env: env.NODE_ENV }, 'server started');
});

// Render sends SIGTERM on redeploys: finish in-flight requests, then exit.
function shutdown(signal: string) {
  logger.info({ signal }, 'shutting down');
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
