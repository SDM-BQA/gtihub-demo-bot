import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { getMe } from '../controllers/me.controller.js';

// Everything under /api needs a signed-in user.
export const apiRouter = Router();

apiRouter.use(requireAuth);
apiRouter.get('/me', getMe);
