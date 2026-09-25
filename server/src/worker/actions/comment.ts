import { commentOnce } from '../../services/github.service.js';
import type { ActionRunner } from './types.js';

export const runComment: ActionRunner = async ({ eventId, installationId, event, rule }) => {
  const ref = { installationId, repoFullName: event.repoFullName, number: event.number! };
  const result = await commentOnce(ref, rule.comment!, `gh-bot:event-${eventId}:rule-${rule.id}`);
  return `comment ${result}`;
};
