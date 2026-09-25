import { prisma } from '../db/prisma.js';

export const MAX_ATTEMPTS = 5;
// Wait before attempt 2, 3, 4, 5.
const BACKOFF_MS = [1, 5, 15, 60].map((minutes) => minutes * 60_000);
// A claimed event is "leased" for this long. If we crash mid-event, it becomes claimable again afterwards.
const LEASE = '10 minutes';

// Atomically claims one due event: a PENDING one whose time has come, or a PROCESSING one whose lease expired (crash).
// FOR UPDATE SKIP LOCKED means two workers running at once can never claim the same row.
export async function claimNextEvent(): Promise<number | null> {
  const rows = await prisma.$queryRaw<{ id: number }[]>`
    UPDATE "Event"
    SET status = 'PROCESSING', attempts = attempts + 1, "nextAttemptAt" = now() + ${LEASE}::interval
    WHERE id = (
      SELECT id FROM "Event"
      WHERE status IN ('PENDING', 'PROCESSING') AND "nextAttemptAt" <= now()
      ORDER BY "nextAttemptAt"
      LIMIT 1
      FOR UPDATE SKIP LOCKED
    )
    RETURNING id`;
  return rows[0]?.id ?? null;
}

export async function markDone(id: number) {
  await prisma.event.update({ where: { id }, data: { status: 'DONE', lastError: null, processedAt: new Date() } });
}

export async function markIgnored(id: number, reason: string) {
  await prisma.event.update({ where: { id }, data: { status: 'IGNORED', lastError: reason, processedAt: new Date() } });
}

// After a failed attempt: schedule the next try with backoff, or give up after MAX_ATTEMPTS (stays visible as FAILED).
export async function retryOrFail(id: number, error: string): Promise<'retry scheduled' | 'gave up'> {
  const { attempts } = await prisma.event.findUniqueOrThrow({ where: { id }, select: { attempts: true } });

  if (attempts >= MAX_ATTEMPTS) {
    await prisma.event.update({ where: { id }, data: { status: 'FAILED', lastError: error, processedAt: new Date() } });
    return 'gave up';
  }

  const nextAttemptAt = new Date(Date.now() + BACKOFF_MS[attempts - 1]);
  await prisma.event.update({ where: { id }, data: { status: 'PENDING', lastError: error, nextAttemptAt } });
  return 'retry scheduled';
}

// When the worker should wake up next (earliest retry or lease expiry), or null if there's nothing left to do.
export async function nextDueAt(): Promise<Date | null> {
  const next = await prisma.event.findFirst({
    where: { status: { in: ['PENDING', 'PROCESSING'] } },
    orderBy: { nextAttemptAt: 'asc' },
    select: { nextAttemptAt: true },
  });
  return next?.nextAttemptAt ?? null;
}
