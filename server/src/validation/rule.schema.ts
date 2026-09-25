import { z } from 'zod';

// Optional text field: trimmed, and empty means "not set" (null), so "" never becomes a condition that matches nothing.
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullish()
    .transform((v) => v || null);

export const ruleSchema = z
  .object({
    name: z.string().trim().min(1, 'Name is required').max(100),
    trigger: z.enum(['ISSUE_OPENED', 'PR_OPENED', 'PUSH']),
    enabled: z.boolean().default(true),

    // Conditions
    titleContains: optionalText(100),
    author: optionalText(39), // GitHub usernames are at most 39 characters
    hasLabel: optionalText(50), // GitHub label names are at most 50 characters

    // Actions
    addLabel: optionalText(50),
    comment: optionalText(2000),
    notifySlack: z.boolean().default(false),
    aiSummary: z.boolean().default(false),
  })
  .refine((r) => r.addLabel || r.comment || r.notifySlack || r.aiSummary, {
    message: 'Choose at least one action',
  });

export type RuleInput = z.infer<typeof ruleSchema>;
