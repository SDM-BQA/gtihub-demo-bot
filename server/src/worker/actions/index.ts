import type { ActionType } from '../../generated/prisma/enums.js';
import { runAddLabel } from './addLabel.js';
import { runAiSummary } from './aiSummary.js';
import { runComment } from './comment.js';
import { runSlack } from './slack.js';
import type { ActionRunner } from './types.js';

// ActionType → runner. Adding an action type means adding one file and one line here.
export const actionRunners: Record<ActionType, ActionRunner> = {
  AI_SUMMARY: runAiSummary,
  ADD_LABEL: runAddLabel,
  COMMENT: runComment,
  SLACK: runSlack,
};
