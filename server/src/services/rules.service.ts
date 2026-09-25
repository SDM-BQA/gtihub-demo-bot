import { prisma } from '../db/prisma.js';
import { HttpError } from '../utils/httpError.js';
import type { RuleInput } from '../validation/rule.schema.js';

// Every query is scoped to the signed-in user's own repos, so changing an ID in the URL can't reach someone else's data.
// Anything the user doesn't own is a 404 (not 403), so we don't even reveal that it exists.
const ownedBy = (userId: number) => ({ installation: { userId } });

async function assertRepoOwned(userId: number, repoId: number) {
  const repo = await prisma.repo.findFirst({ where: { id: repoId, active: true, ...ownedBy(userId) }, select: { id: true } });
  if (!repo) throw new HttpError(404, 'Repository not found');
}

async function assertRuleOwned(userId: number, ruleId: number) {
  const rule = await prisma.rule.findFirst({ where: { id: ruleId, repo: ownedBy(userId) }, select: { id: true } });
  if (!rule) throw new HttpError(404, 'Rule not found');
}

export async function listRules(userId: number, repoId: number) {
  await assertRepoOwned(userId, repoId);
  return prisma.rule.findMany({ where: { repoId }, orderBy: { createdAt: 'asc' } });
}

export async function createRule(userId: number, repoId: number, input: RuleInput) {
  await assertRepoOwned(userId, repoId);
  return prisma.rule.create({ data: { ...input, repoId } });
}

export async function updateRule(userId: number, ruleId: number, input: RuleInput) {
  await assertRuleOwned(userId, ruleId);
  return prisma.rule.update({ where: { id: ruleId }, data: input });
}

// Past action logs keep their history: ActionLog.ruleId is set to null (onDelete: SetNull).
export async function deleteRule(userId: number, ruleId: number) {
  await assertRuleOwned(userId, ruleId);
  await prisma.rule.delete({ where: { id: ruleId } });
}
