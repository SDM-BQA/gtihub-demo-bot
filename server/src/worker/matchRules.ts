import type { Rule } from '../generated/prisma/client.js';
import type { ActionType } from '../generated/prisma/enums.js';
import type { NormalizedEvent } from '../github/normalize.js';

const same = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

// All filled-in conditions must match (AND). Empty conditions are ignored. Case-insensitive.
export function matchesRule(rule: Rule, event: NormalizedEvent): boolean {
  if (!rule.enabled || rule.trigger !== event.trigger) return false;
  if (rule.titleContains && !event.title.toLowerCase().includes(rule.titleContains.trim().toLowerCase())) return false;
  if (rule.author && !same(rule.author, event.author)) return false;
  if (rule.hasLabel && !event.labels.some((label) => same(label, rule.hasLabel!))) return false;
  return true;
}

// The actions a rule asks for, in the order they run. Label and comment need an issue/PR number, so pushes only get Slack.
export function plannedActions(rule: Rule, event: NormalizedEvent): ActionType[] {
  const actions: ActionType[] = [];
  if (rule.addLabel && event.number !== null) actions.push('ADD_LABEL');
  if (rule.comment && event.number !== null) actions.push('COMMENT');
  if (rule.notifySlack) actions.push('SLACK');
  return actions;
}
