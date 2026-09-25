import type { ActionType, BotEvent } from '../types';
import { relativeTime } from './time';

export const EVENT_LABELS: Record<string, string> = {
  issues: 'Issue',
  pull_request: 'Pull request',
  push: 'Push',
};

export const ACTION_LABELS: Record<ActionType, string> = {
  ADD_LABEL: 'Label',
  COMMENT: 'Comment',
  SLACK: 'Slack',
  AI_SUMMARY: 'AI summary',
};

export type StatusView = { tone: 'ok' | 'warn' | 'bad' | 'muted'; label: string; hint?: string };

// Turns the raw queue state into what a person wants to know: did it work, is it retrying, did it give up?
export function describeStatus(event: BotEvent, maxAttempts: number): StatusView {
  switch (event.status) {
    case 'DONE':
      return event.actionLogs.length ? { tone: 'ok', label: 'Done' } : { tone: 'muted', label: 'No rule matched' };
    case 'FAILED':
      return { tone: 'bad', label: 'Failed', hint: `gave up after ${event.attempts} attempts` };
    case 'IGNORED':
      return { tone: 'muted', label: 'Ignored', hint: event.lastError ?? undefined };
    case 'PROCESSING':
      return { tone: 'warn', label: 'Processing' };
    case 'PENDING':
      return event.attempts === 0
        ? { tone: 'warn', label: 'Queued' }
        : { tone: 'warn', label: 'Retrying', hint: `attempt ${event.attempts + 1}/${maxAttempts} ${relativeTime(event.nextAttemptAt)}` };
  }
}
