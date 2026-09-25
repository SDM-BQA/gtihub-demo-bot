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

export type EventStatus = 'PENDING' | 'PROCESSING' | 'DONE' | 'FAILED' | 'IGNORED';
export type ActionType = 'ADD_LABEL' | 'COMMENT' | 'SLACK' | 'AI_SUMMARY';

export type ActionLog = {
  id: number;
  type: ActionType;
  status: 'SUCCESS' | 'FAILED';
  attempts: number;
  detail: string | null;
  error: string | null;
  rule: { name: string } | null; // null if the rule was deleted later
};

export type BotEvent = {
  id: number;
  githubEvent: string; // "issues" | "pull_request" | "push"
  title: string | null;
  author: string | null;
  url: string | null;
  status: EventStatus;
  attempts: number;
  nextAttemptAt: string;
  lastError: string | null;
  receivedAt: string;
  processedAt: string | null;
  aiSummary: string | null;
  aiPriority: string | null;
  aiLabel: string | null;
  actionLogs: ActionLog[];
};

export type EventsResponse = { events: BotEvent[]; maxAttempts: number };
