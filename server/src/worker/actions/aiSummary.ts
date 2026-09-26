import { prisma } from '../../db/prisma.js';
import { triageWithAI } from '../../services/ai.service.js';
import type { ActionRunner } from './types.js';

// Computed once per event and stored on the Event row, so retries and other rules reuse it instead of calling the AI again.
export const runAiSummary: ActionRunner = async ({ eventId, event }) => {
  const existing = await prisma.event.findUniqueOrThrow({ where: { id: eventId }, select: { aiSummary: true } });
  if (existing.aiSummary) return 'reused existing AI summary';

  const triage = await triageWithAI(event);
  await prisma.event.update({
    where: { id: eventId },
    data: { aiSummary: triage.summary, aiPriority: triage.priority, aiLabel: triage.label },
  });
  return `priority ${triage.priority} · suggested label "${triage.label}"`;
};
