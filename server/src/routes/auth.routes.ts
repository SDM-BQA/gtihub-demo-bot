import { Router } from 'express';
import { callback, install, login, logout } from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/requireAuth.js';

export const authRouter = Router();

authRouter.get('/github/login', login);
authRouter.get('/github/install', requireAuth, install);
authRouter.get('/github/callback', callback);
authRouter.post('/logout', logout);
