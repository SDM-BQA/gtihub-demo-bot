import { deactivateInstallation, syncInstallationFromWebhook } from '../services/installation.service.js';
import type { WebhookContext } from './types.js';

// installation (created/deleted/suspend/unsuspend...) and installation_repositories (added/removed).
// These keep our repo list in sync with GitHub without the user pressing "Refresh".
export async function handleInstallationEvent({ payload }: WebhookContext): Promise<string> {
  const installation = payload.installation;
  if (!installation) return 'ignored: no installation in payload';

  if (payload.action === 'deleted' || payload.action === 'suspend') {
    await deactivateInstallation(installation.id);
    return 'installation deactivated';
  }

  await syncInstallationFromWebhook(installation.id, installation.account?.login ?? 'unknown', payload.sender?.id);
  return 'installation synced';
}
