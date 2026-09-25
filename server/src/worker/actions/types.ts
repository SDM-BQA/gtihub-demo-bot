import type { Rule } from '../../generated/prisma/client.js';
import type { NormalizedEvent } from '../../github/normalize.js';

// Everything an action needs to do its job.
export interface ActionContext {
  eventId: number;
  installationId: number;
  event: NormalizedEvent;
  rule: Rule;
}

// Returns a short human-readable detail for the dashboard ("added label bug"). Throws on failure.
export type ActionRunner = (ctx: ActionContext) => Promise<string>;
