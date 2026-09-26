import { githubApp } from '../github/app.js';
import { logger } from '../utils/logger.js';

// GitHub does NOT retry a webhook that failed (e.g. timed out while Render's free tier was waking up). This sweeper asks
// GitHub which deliveries failed and requests a redelivery. Safe to repeat: our unique deliveryId turns an extra
// redelivery into a harmless "duplicate". It only calls GitHub, never our DB, so Neon can still sleep.

const SWEEP_EVERY_MS = 30 * 60_000;
const FIRST_SWEEP_AFTER_MS = 30_000; // let GitHub finish timing out the request that woke us up
const MAX_ATTEMPTS_PER_DELIVERY = 3; // stop redelivering something that keeps failing (e.g. a misconfigured secret)
const LOOKBACK_MS = 2 * 24 * 60 * 60_000; // GitHub allows redelivery for 3 days; stay safely inside that

type Delivery = { id: number; guid: string; status_code: number; delivered_at: string };

let timers: NodeJS.Timeout[] = [];

export async function redeliverFailedDeliveries(): Promise<{ checked: number; redelivered: number }> {
  const since = Date.now() - LOOKBACK_MS;

  // Newest first; stop paging once we're past the lookback window.
  const deliveries: Delivery[] = await githubApp.octokit.paginate(
    'GET /app/hook/deliveries',
    { per_page: 100 },
    (response, done) => {
      const page = response.data as Delivery[];
      if (page.some((d) => new Date(d.delivered_at).getTime() < since)) done();
      return page.filter((d) => new Date(d.delivered_at).getTime() >= since);
    },
  );

  // A redelivery keeps the same GUID, so group every attempt of one delivery together.
  const byGuid = Map.groupBy(deliveries, (d) => d.guid);
  let redelivered = 0;

  for (const [guid, attempts] of byGuid) {
    const succeeded = attempts.some((a) => a.status_code >= 200 && a.status_code < 300);
    if (succeeded || attempts.length >= MAX_ATTEMPTS_PER_DELIVERY) continue;

    const latest = attempts[0]; // list is newest first
    try {
      await githubApp.octokit.request('POST /app/hook/deliveries/{delivery_id}/attempts', { delivery_id: latest.id });
      redelivered++;
      logger.info({ guid, lastStatus: latest.status_code, attempts: attempts.length }, 'requested webhook redelivery');
    } catch (err) {
      logger.warn({ guid, err }, 'webhook redelivery request failed');
    }
  }

  return { checked: byGuid.size, redelivered };
}

async function sweep() {
  try {
    const result = await redeliverFailedDeliveries();
    logger.info(result, 'redelivery sweep finished');
  } catch (err) {
    logger.error({ err }, 'redelivery sweep failed'); // try again next time
  }
}

export function startRedeliverySweeper() {
  timers = [setTimeout(sweep, FIRST_SWEEP_AFTER_MS), setInterval(sweep, SWEEP_EVERY_MS)];
}

export function stopRedeliverySweeper() {
  timers.forEach(clearTimeout);
}
