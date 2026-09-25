import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { getMe } from '../controllers/me.controller.js';
import * as events from '../controllers/events.controller.js';
import { rulesRouter } from './rules.routes.js';

// Everything under /api needs a signed-in user.
export const apiRouter = Router();

apiRouter.use(requireAuth);
apiRouter.get('/me', getMe);
apiRouter.get('/repos/:repoId/events', events.list);
apiRouter.use(rulesRouter);
