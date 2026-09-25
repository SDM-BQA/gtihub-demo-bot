import type { Request, Response } from 'express';
import { getProfile } from '../services/user.service.js';

export async function getMe(req: Request, res: Response) {
  res.json(await getProfile(req.session.userId!));
}
