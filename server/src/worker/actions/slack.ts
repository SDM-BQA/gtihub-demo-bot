import { sendSlackMessage } from '../../services/slack.service.js';
import type { NormalizedEvent } from '../../github/normalize.js';
import type { ActionRunner } from './types.js';

const headline: Record<NormalizedEvent['trigger'], string> = {
  ISSUE_OPENED: 'New issue',
  PR_OPENED: 'New pull request',
  PUSH: 'New push',
};

// Slack's link syntax is <url|text>; these characters would break it.
const escape = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export const runSlack: ActionRunner = async ({ event, rule }) => {
  const ref = event.number !== null ? ` #${event.number}` : '';
  const text = [
    `*${headline[event.trigger]}* in \`${event.repoFullName}\`${ref} by *${escape(event.author)}*`,
    `<${event.url}|${escape(event.title)}>`,
    `_Rule: ${escape(rule.name)}_`,
  ].join('\n');

  await sendSlackMessage(text);
  return 'sent Slack notification';
};
