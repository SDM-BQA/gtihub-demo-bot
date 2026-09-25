// Shapes returned by the API.

export type Repo = { id: number; fullName: string };

export type Me = {
  user: { login: string; avatarUrl: string | null };
  repos: Repo[];
};

export type Trigger = 'ISSUE_OPENED' | 'PR_OPENED' | 'PUSH';

// What the rule form edits and the API accepts.
export type RuleInput = {
  name: string;
  trigger: Trigger;
  enabled: boolean;
  titleContains: string | null;
  author: string | null;
  hasLabel: string | null;
  addLabel: string | null;
  comment: string | null;
  notifySlack: boolean;
  aiSummary: boolean;
};

export type Rule = RuleInput & { id: number; repoId: number };
