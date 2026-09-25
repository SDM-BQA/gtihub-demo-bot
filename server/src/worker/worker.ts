import { logger } from '../utils/logger.js';
import { processEvent } from './processEvent.js';
import { claimNextEvent, markDone, markIgnored, nextDueAt, retryOrFail } from './queue.js';

// The worker does NOT poll the database on a fixed interval (that would keep Neon's free tier awake 24/7).
// It wakes up when: a webhook is saved (wakeWorker), the server starts, or a timer for the next retry fires.

let running = false;
let wakeRequested = false;
let stopped = false;
let timer: NodeJS.Timeout | undefined;

export function wakeWorker() {
  if (stopped) return;
  if (running) {
    wakeRequested = true; // a new event arrived mid-run; do another pass when this one finishes
    return;
  }
  void run();
}

export const startWorker = wakeWorker;

export function stopWorker() {
  stopped = true;
  clearTimeout(timer);
}

async function run() {
  running = true;
  clearTimeout(timer);
  try {
    do {
      wakeRequested = false;
      let id: number | null;
      while (!stopped && (id = await claimNextEvent()) !== null) await handleEvent(id);
    } while (wakeRequested && !stopped);

    await scheduleNextWake();
  } catch (err) {
    // Usually the database is unreachable. Try again in a minute; nothing is lost because events stay in the table.
    logger.error({ err }, 'worker run failed, retrying in 60s');
    if (!stopped) timer = setTimeout(wakeWorker, 60_000);
  } finally {
    running = false;
  }
}

async function handleEvent(id: number) {
  const log = logger.child({ eventId: id });
  try {
    const result = await processEvent(id);

    if ('ignored' in result) {
      await markIgnored(id, result.ignored);
      log.info({ reason: result.ignored }, 'event ignored');
    } else if (result.errors.length === 0) {
      await markDone(id);
      log.info('event processed');
    } else {
      const outcome = await retryOrFail(id, result.errors.join('\n'));
      log.warn({ errors: result.errors, outcome }, 'event had failed actions');
    }
  } catch (err) {
    // Unexpected error (e.g. DB hiccup mid-event). If this also fails, the 10-minute lease makes the event retry anyway.
    const message = err instanceof Error ? err.message : String(err);
    const outcome = await retryOrFail(id, message).catch(() => 'lease will expire');
    log.error({ err, outcome }, 'event processing crashed');
  }
}

async function scheduleNextWake() {
  const due = await nextDueAt();
  if (!due || stopped) return;
  const delay = Math.max(0, due.getTime() - Date.now());
  timer = setTimeout(wakeWorker, delay);
  logger.debug({ inSeconds: Math.round(delay / 1000) }, 'worker sleeping until next retry');
}
