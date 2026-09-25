import { prisma } from '../db/prisma.js';
import { HttpError } from '../utils/httpError.js';

// Every query on user data is scoped to the signed-in user's own repos, so changing an ID in the URL can't reach
// someone else's data. Anything the user doesn't own is a 404 (not 403), so we don't even reveal that it exists.
export const ownedBy = (userId: number) => ({ installation: { userId } });

export async function assertRepoOwned(userId: number, repoId: number) {
  const repo = await prisma.repo.findFirst({ where: { id: repoId, active: true, ...ownedBy(userId) }, select: { id: true } });
  if (!repo) throw new HttpError(404, 'Repository not found');
}

export async function assertRuleOwned(userId: number, ruleId: number) {
  const rule = await prisma.rule.findFirst({ where: { id: ruleId, repo: ownedBy(userId) }, select: { id: true } });
  if (!rule) throw new HttpError(404, 'Rule not found');
}
