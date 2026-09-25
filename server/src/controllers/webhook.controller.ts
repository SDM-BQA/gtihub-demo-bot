import type { Request, Response } from 'express';
import { webhookHandlers } from '../webhooks/handlers.js';
import type { WebhookPayload } from '../github/payloads.js';
import { HttpError } from '../utils/httpError.js';

// Runs only after verifyGithubSignature, so the body is known to come from GitHub.
export async function receiveGithubWebhook(req: Request, res: Response) {
  const githubEvent = req.header('x-github-event');
  const deliveryId = req.header('x-github-delivery');
  if (!githubEvent || !deliveryId) throw new HttpError(400, 'Missing GitHub headers');

  const handler = webhookHandlers[githubEvent];
  if (!handler) {
    req.log.info({ githubEvent, deliveryId }, 'webhook ignored: unsupported event type');
    return res.status(204).end();
  }

  let payload: WebhookPayload;
  try {
    payload = JSON.parse((req.body as Buffer).toString('utf8'));
  } catch {
    throw new HttpError(400, 'Body is not valid JSON');
  }

  const result = await handler({ deliveryId, githubEvent, payload });

  // Log identifiers only, never the payload (it can contain private issue text).
  req.log.info({ githubEvent, action: payload.action, deliveryId, repo: payload.repository?.full_name, result }, 'webhook handled');
  res.status(202).json({ result });
}
