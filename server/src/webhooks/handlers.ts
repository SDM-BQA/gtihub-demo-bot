import { recordEvent } from './recordEvent.js';
import { handleInstallationEvent } from './installationEvents.js';
import type { WebhookHandler } from './types.js';

// X-GitHub-Event → handler. Supporting a new event type means adding one line here.
export const webhookHandlers: Record<string, WebhookHandler> = {
  ping: async () => 'pong',
  installation: handleInstallationEvent,
  installation_repositories: handleInstallationEvent,
  issues: recordEvent,
  pull_request: recordEvent,
  push: recordEvent,
};
