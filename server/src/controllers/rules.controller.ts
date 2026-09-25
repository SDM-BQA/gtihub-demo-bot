import type { Request, Response } from 'express';
import * as rules from '../services/rules.service.js';
import { parseId } from '../utils/parseId.js';

// requireAuth has already run, so userId is set. req.body was validated by validateBody(ruleSchema).

export async function list(req: Request, res: Response) {
  res.json(await rules.listRules(req.session.userId!, parseId(req.params.repoId)));
}

export async function create(req: Request, res: Response) {
  res.status(201).json(await rules.createRule(req.session.userId!, parseId(req.params.repoId), req.body));
}

export async function update(req: Request, res: Response) {
  res.json(await rules.updateRule(req.session.userId!, parseId(req.params.id), req.body));
}

export async function remove(req: Request, res: Response) {
  await rules.deleteRule(req.session.userId!, parseId(req.params.id));
  res.status(204).end();
}
