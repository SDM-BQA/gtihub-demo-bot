import type { Rule, RuleInput, Trigger } from '../types';

export const TRIGGER_LABELS: Record<Trigger, string> = {
  ISSUE_OPENED: 'Issue opened',
  PR_OPENED: 'Pull request opened',
  PUSH: 'Code pushed',
};

export const EMPTY_RULE: RuleInput = {
  name: '',
  trigger: 'ISSUE_OPENED',
  enabled: true,
  titleContains: null,
  author: null,
  hasLabel: null,
  addLabel: null,
  comment: null,
  notifySlack: true,
  aiSummary: false,
};

// Strips server-only fields (id, timestamps) so a rule can be sent back as input.
export function toRuleInput(rule: Rule): RuleInput {
  const { name, trigger, enabled, titleContains, author, hasLabel, addLabel, comment, notifySlack, aiSummary } = rule;
  return { name, trigger, enabled, titleContains, author, hasLabel, addLabel, comment, notifySlack, aiSummary };
}

// "Issue opened · title contains "bug"" → "add label bug, comment, Slack"
export function describeRule(rule: RuleInput): { when: string; then: string } {
  const conditions = [
    rule.titleContains && `title contains "${rule.titleContains}"`,
    rule.author && `author is ${rule.author}`,
    rule.hasLabel && `has label "${rule.hasLabel}"`,
  ].filter(Boolean);

  const actions = [
    rule.addLabel && `add label "${rule.addLabel}"`,
    rule.comment && 'comment',
    rule.notifySlack && 'Slack alert',
    rule.aiSummary && 'AI summary',
  ].filter(Boolean);

  return {
    when: [TRIGGER_LABELS[rule.trigger], ...conditions].join(' · '),
    then: actions.join(', '),
  };
}
