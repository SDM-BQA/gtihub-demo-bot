import { prisma } from '../../db/prisma.js';
import { sendSlackMessage } from '../../services/slack.service.js';
import type { NormalizedEvent } from '../../github/normalize.js';
import type { ActionRunner } from './types.js';

const headline: Record<NormalizedEvent['trigger'], string> = {
  ISSUE_OPENED: 'New issue',
  PR_OPENED: 'New pull request',
  PUSH: 'New push',
};

const priorityIcon: Record<string, string> = { critical: '🔴', high: '🟠', medium: '🟡', low: '🟢' };

// Slack's link syntax is <url|text>; these characters would break it.
const escape = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export const runSlack: ActionRunner = async ({ eventId, event, rule }) => {
  // AI summary actions run before Slack, so if any rule asked for one, it's already stored on the event.
  const ai = await prisma.event.findUnique({
    where: { id: eventId },
    select: { aiSummary: true, aiPriority: true, aiLabel: true },
  });

  const ref = event.number !== null ? ` #${event.number}` : '';
  const lines = [
    `*${headline[event.trigger]}* in \`${event.repoFullName}\`${ref} by *${escape(event.author)}*`,
    `<${event.url}|${escape(event.title)}>`,
  ];
  if (ai?.aiSummary) {
    const icon = priorityIcon[ai.aiPriority ?? ''] ?? '';
    lines.push(`>${icon} *${ai.aiPriority}* · ${escape(ai.aiSummary)} _(AI · suggested label: ${escape(ai.aiLabel ?? '-')})_`);
  }
  lines.push(`_Rule: ${escape(rule.name)}_`);

  await sendSlackMessage(lines.join('\n'));
  return 'sent Slack notification';
};
