import { env } from '../config/env.js';

// Posts a message to the Slack channel behind the Incoming Webhook. Throws on failure so the worker can retry.
export async function sendSlackMessage(text: string): Promise<void> {
  const res = await fetch(env.SLACK_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
    signal: AbortSignal.timeout(10_000), // don't let a hanging Slack call block the worker
  });

  // Slack's error body is a short code like "no_service"; it never contains the URL.
  if (!res.ok) throw new Error(`Slack responded ${res.status}: ${await res.text()}`);
}
