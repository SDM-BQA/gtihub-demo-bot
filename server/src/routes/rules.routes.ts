import { Router } from 'express';
import * as rules from '../controllers/rules.controller.js';
import { validateBody } from '../middleware/validate.js';
import { ruleSchema } from '../validation/rule.schema.js';

export const rulesRouter = Router();

rulesRouter.get('/repos/:repoId/rules', rules.list);
rulesRouter.post('/repos/:repoId/rules', validateBody(ruleSchema), rules.create);
rulesRouter.put('/rules/:id', validateBody(ruleSchema), rules.update);
rulesRouter.delete('/rules/:id', rules.remove);
