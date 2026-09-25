import { prisma } from '../db/prisma.js';
import { MAX_ATTEMPTS } from '../worker/queue.js';
import { assertRepoOwned } from './ownership.service.js';

const PAGE_SIZE = 50;

// The activity log for one repo: latest events with the actions the bot took. The raw payload is never sent to the browser.
export async function listEvents(userId: number, repoId: number) {
  await assertRepoOwned(userId, repoId);

  const events = await prisma.event.findMany({
    where: { repoId },
    orderBy: { receivedAt: 'desc' },
    take: PAGE_SIZE,
    select: {
      id: true,
      githubEvent: true,
      title: true,
      author: true,
      url: true,
      status: true,
      attempts: true,
      nextAttemptAt: true,
      lastError: true,
      receivedAt: true,
      processedAt: true,
      aiSummary: true,
      aiPriority: true,
      aiLabel: true,
      actionLogs: {
        orderBy: { id: 'asc' },
        select: { id: true, type: true, status: true, attempts: true, detail: true, error: true, rule: { select: { name: true } } },
      },
    },
  });

  return { events, maxAttempts: MAX_ATTEMPTS };
}
