import { prisma } from '../db/prisma.js';
import type { ActionStatus, ActionType } from '../generated/prisma/enums.js';
import { normalize } from '../github/normalize.js';
import type { WebhookPayload } from '../github/payloads.js';
import { matchesRule, plannedActions } from '../services/rules.service.js';
import { logger } from '../utils/logger.js';
import { actionRunners } from './actions/index.js';

export type ProcessResult = { ignored: string } | { errors: string[] };

// Runs every action of every matching rule for one event. Actions that already succeeded on an earlier attempt are
// skipped, so a retry only redoes what failed. Returns the errors (empty = all done).
export async function processEvent(eventId: number): Promise<ProcessResult> {
  const record = await prisma.event.findUniqueOrThrow({
    where: { id: eventId },
    include: { repo: { include: { installation: true, rules: true } } },
  });

  const event = normalize(record.githubEvent, record.payload as WebhookPayload);
  if (!record.repo?.active || !event) return { ignored: 'repository disconnected or event not handled' };

  const matchingRules = record.repo.rules.filter((rule) => matchesRule(rule, event));
  const succeeded = await prisma.actionLog.findMany({
    where: { eventId, status: 'SUCCESS' },
    select: { ruleId: true, type: true },
  });
  const alreadyDone = (ruleId: number, type: ActionType) =>
    succeeded.some((a) => a.ruleId === ruleId && a.type === type);

  const installationId = Number(record.repo.installation.githubInstallationId);
  const errors: string[] = [];

  for (const rule of matchingRules) {
    for (const type of plannedActions(rule, event)) {
      if (alreadyDone(rule.id, type)) continue;

      try {
        const detail = await actionRunners[type]!({ eventId, installationId, event, rule });
        await recordAction(eventId, rule.id, type, 'SUCCESS', { detail });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        errors.push(`${type} (rule "${rule.name}"): ${message}`);
        await recordAction(eventId, rule.id, type, 'FAILED', { error: message });
        logger.warn({ eventId, ruleId: rule.id, action: type, err: message }, 'action failed');
      }
    }
  }

  return { errors };
}

// One row per (event, rule, action). Retries update the same row and count attempts, so the dashboard shows the history.
async function recordAction(
  eventId: number,
  ruleId: number,
  type: ActionType,
  status: ActionStatus,
  { detail = null, error = null }: { detail?: string | null; error?: string | null },
) {
  await prisma.actionLog.upsert({
    where: { eventId_ruleId_type: { eventId, ruleId, type } },
    create: { eventId, ruleId, type, status, detail, error },
    update: { status, detail, error, attempts: { increment: 1 } },
  });
}
