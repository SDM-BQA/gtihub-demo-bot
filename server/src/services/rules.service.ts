import { prisma } from '../db/prisma.js';
import type { RuleInput } from '../validation/rule.schema.js';
import { assertRepoOwned, assertRuleOwned } from './ownership.service.js';

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
