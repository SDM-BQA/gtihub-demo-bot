import { createApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import { startWorker, stopWorker } from './worker/worker.js';

const server = createApp().listen(env.PORT, () => {
  logger.info({ port: env.PORT, env: env.NODE_ENV }, 'server started');
  // Picks up anything left over from before a restart or a Render sleep (pending events, due retries, expired leases).
  startWorker();
});

// Render sends SIGTERM on redeploys: stop taking new work, finish in-flight requests, then exit.
function shutdown(signal: string) {
  logger.info({ signal }, 'shutting down');
  stopWorker();
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
