import path from 'node:path';
import express, { type Express } from 'express';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';
import { isProd } from './config/env.js';
import { logger } from './utils/logger.js';
import { healthRouter } from './routes/health.routes.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';

const clientDist = path.resolve(import.meta.dirname, '../../client/dist');

export function createApp(): Express {
  const app = express();

  // Render terminates HTTPS at its proxy; this lets Express see the real protocol (needed for secure cookies).
  app.set('trust proxy', 1);
  app.use(helmet());
  app.use(
    pinoHttp({
      logger,
      autoLogging: { ignore: (req) => req.url === '/health' },
      // Log only what we need; request headers can carry cookies and signatures.
      serializers: {
        req: (req) => ({ id: req.id, method: req.method, url: req.url }),
        res: (res) => ({ statusCode: res.statusCode }),
      },
    }),
  );

  app.use('/health', healthRouter);

  // The webhook route will be mounted here: it needs the raw body for signature checks, so it goes before express.json().
  app.use(express.json({ limit: '100kb' }));

  app.use('/api', notFound);

  // In production Express serves the built React app; in dev, Vite serves it and proxies API calls here.
  if (isProd) {
    app.use(express.static(clientDist));
    app.get('/{*splat}', (_req, res) => res.sendFile(path.join(clientDist, 'index.html')));
  }

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
