import { addLabel } from '../../services/github.service.js';
import type { ActionRunner } from './types.js';

export const runAddLabel: ActionRunner = async ({ installationId, event, rule }) => {
  const label = rule.addLabel!;
  await addLabel({ installationId, repoFullName: event.repoFullName, number: event.number! }, label);
  return `added label "${label}"`;
};
