import { Router } from 'express';

// Used by Render's health check and the keep-alive pinger.
export const healthRouter = Router();

healthRouter.get('/', (_req, res) => {
  res.json({ status: 'ok', uptime: Math.round(process.uptime()) });
});
