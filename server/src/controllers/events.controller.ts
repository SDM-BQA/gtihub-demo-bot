import type { Request, Response } from 'express';
import { listEvents } from '../services/events.service.js';
import { parseId } from '../utils/parseId.js';

export async function list(req: Request, res: Response) {
  res.json(await listEvents(req.session.userId!, parseId(req.params.repoId)));
}
