import { prisma } from '../db/prisma.js';
import { normalize } from '../github/normalize.js';
import type { WebhookContext } from './types.js';

// issues / pull_request / push: save the event for the worker. No GitHub or Slack calls here; we must reply fast.
export async function recordEvent({ deliveryId, githubEvent, payload }: WebhookContext): Promise<string> {
  const event = normalize(githubEvent, payload);
  if (!event) return 'ignored: action not handled';

  // The bot's own label/comment would otherwise trigger more webhooks, looping forever.
  if (payload.sender?.type === 'Bot') return 'ignored: sent by a bot';

  const repo = await prisma.repo.findUnique({
    where: { githubRepoId: BigInt(payload.repository!.id) },
    select: { id: true, active: true },
  });
  if (!repo?.active) return 'ignored: repository not connected';

  // deliveryId is unique: a replayed or redelivered webhook inserts nothing (count 0) instead of creating a duplicate.
  const { count } = await prisma.event.createMany({
    data: {
      deliveryId,
      githubEvent,
      action: payload.action ?? null,
      repoId: repo.id,
      payload: payload as object,
      title: event.title,
      author: event.author,
      url: event.url,
    },
    skipDuplicates: true,
  });

  return count === 0 ? 'duplicate: already recorded' : 'recorded';
}
