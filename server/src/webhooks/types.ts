import type { WebhookPayload } from '../github/payloads.js';

export interface WebhookContext {
  deliveryId: string; // X-GitHub-Delivery: unique per delivery, the same when GitHub redelivers it
  githubEvent: string; // X-GitHub-Event: "issues", "push", ...
  payload: WebhookPayload;
}

// A handler returns a short outcome string for the logs and the HTTP response.
export type WebhookHandler = (ctx: WebhookContext) => Promise<string>;
