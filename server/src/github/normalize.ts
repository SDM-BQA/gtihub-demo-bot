import type { Trigger } from '../generated/prisma/enums.js';
import type { IssueLike, WebhookPayload } from './payloads.js';

// One shape for every event we handle, so rules and actions never deal with raw GitHub payloads.
export interface NormalizedEvent {
  trigger: Trigger;
  repoFullName: string;
  number: number | null; // issue/PR number; null for pushes
  title: string;
  body: string;
  author: string;
  labels: string[];
  url: string;
}

type Normalizer = (payload: WebhookPayload) => NormalizedEvent | null;

function fromIssueLike(trigger: Trigger, item: IssueLike, payload: WebhookPayload): NormalizedEvent {
  return {
    trigger,
    repoFullName: payload.repository!.full_name,
    number: item.number,
    title: item.title,
    body: item.body ?? '',
    author: item.user.login,
    labels: (item.labels ?? []).map((l) => l.name),
    url: item.html_url,
  };
}

// Keyed by the X-GitHub-Event header. Returns null for actions we don't act on (e.g. "closed", "labeled").
const normalizers: Record<string, Normalizer> = {
  issues: (p) => (p.action === 'opened' && p.issue ? fromIssueLike('ISSUE_OPENED', p.issue, p) : null),

  pull_request: (p) =>
    p.action === 'opened' && p.pull_request ? fromIssueLike('PR_OPENED', p.pull_request, p) : null,

  push: (p) => {
    if (p.deleted || !p.head_commit) return null; // branch deletion: no commits to report
    const branch = p.ref?.replace('refs/heads/', '') ?? '';
    const [firstLine, ...rest] = p.head_commit.message.split('\n');
    return {
      trigger: 'PUSH',
      repoFullName: p.repository!.full_name,
      number: null,
      title: `${firstLine} (${p.commits?.length ?? 1} commit(s) to ${branch})`,
      body: rest.join('\n').trim(),
      author: p.sender?.login ?? 'unknown',
      labels: [],
      url: p.compare ?? p.head_commit.url,
    };
  },
};

export function normalize(githubEvent: string, payload: WebhookPayload): NormalizedEvent | null {
  return normalizers[githubEvent]?.(payload) ?? null;
}
