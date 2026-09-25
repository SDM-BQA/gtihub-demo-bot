// The small subset of GitHub webhook payload fields this app reads. Everything else is ignored.

type Label = { name: string };

// Issues and pull requests share these fields.
export interface IssueLike {
  number: number;
  title: string;
  body: string | null;
  html_url: string;
  user: { login: string };
  labels?: Label[];
}

export interface WebhookPayload {
  action?: string;
  sender?: { id: number; login: string; type: string };
  repository?: { id: number; full_name: string };
  installation?: { id: number; account?: { login: string } };

  issue?: IssueLike;
  pull_request?: IssueLike;

  // push
  ref?: string;
  deleted?: boolean;
  compare?: string;
  head_commit?: { message: string; url: string } | null;
  commits?: unknown[];
}
