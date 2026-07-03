import type { SprintStoryGoalStatus } from "@/lib/sprints/sprint-snapshot-types";
import { parseGoalTagNames } from "@/lib/sprints/goal-tags-serialization";
import { isSprintStoryGoalDraftEmpty } from "@/lib/sprints/sprint-story-goal";

export type EvaluateStoryGoalStatusInput = {
  includedInGoal: boolean;
  baselineStateName: string | null;
  baselineTacTagName: string | null;
  targetStateName: string | null;
  targetTacTagName: string | null;
  finalStateName: string | null;
  finalTacTagName: string | null;
  finalTagNames?: readonly string[];
  backlogStateOrder: readonly string[];
};

function normalizeText(value: string | null | undefined): string {
  return value?.trim().toLowerCase() ?? "";
}

export function resolveStateIndexInBacklogOrder(
  stateName: string | null | undefined,
  backlogStateOrder: readonly string[],
): number | null {
  const normalized = normalizeText(stateName);
  if (!normalized) return null;

  const index = backlogStateOrder.findIndex(
    (state) => normalizeText(state) === normalized,
  );
  return index >= 0 ? index : null;
}

/** Estado actual en o después del objetivo según el orden del backlog de ADO. */
export function isStateAtLeastTarget(
  finalStateName: string | null | undefined,
  targetStateName: string | null | undefined,
  backlogStateOrder: readonly string[],
): boolean {
  const targetState = targetStateName?.trim() ?? "";
  if (!targetState) return false;

  const finalStateIndex = resolveStateIndexInBacklogOrder(finalStateName, backlogStateOrder);
  const targetStateIndex = resolveStateIndexInBacklogOrder(targetState, backlogStateOrder);

  return (
    finalStateIndex !== null &&
    targetStateIndex !== null &&
    finalStateIndex >= targetStateIndex
  );
}

function isTargetDefined(
  targetStateName: string | null,
  targetTacTagName: string | null,
): boolean {
  return !isSprintStoryGoalDraftEmpty({
    targetStateName: targetStateName ?? "",
    targetTagNames: parseGoalTagNames(targetTacTagName),
  });
}

function resolveFinalTagNames(input: EvaluateStoryGoalStatusInput): string[] {
  if (input.finalTagNames?.length) {
    return input.finalTagNames.map((tag) => tag.trim()).filter(Boolean);
  }
  const single = input.finalTacTagName?.trim();
  return single ? [single] : [];
}

function isStateTargetMet(input: EvaluateStoryGoalStatusInput): boolean {
  return isStateAtLeastTarget(
    input.finalStateName,
    input.targetStateName,
    input.backlogStateOrder,
  );
}

function isTacTargetMet(input: EvaluateStoryGoalStatusInput): boolean {
  const targetTags = parseGoalTagNames(input.targetTacTagName);
  if (targetTags.length === 0) return false;

  const finalTags = new Set(resolveFinalTagNames(input).map((tag) => normalizeText(tag)));
  return targetTags.every((tag) => finalTags.has(normalizeText(tag)));
}

function isTargetAchieved(input: EvaluateStoryGoalStatusInput): boolean {
  const stateRequired = Boolean(input.targetStateName?.trim());
  const tacRequired = parseGoalTagNames(input.targetTacTagName).length > 0;
  const stateMet = isStateTargetMet(input);
  const tacMet = isTacTargetMet(input);

  if (stateRequired && tacRequired) return stateMet && tacMet;
  if (stateRequired) return stateMet;
  if (tacRequired) return tacMet;
  return false;
}

function hasStateProgressFromBaseline(input: EvaluateStoryGoalStatusInput): boolean {
  const baselineStateIndex = resolveStateIndexInBacklogOrder(
    input.baselineStateName,
    input.backlogStateOrder,
  );
  const finalStateIndex = resolveStateIndexInBacklogOrder(
    input.finalStateName,
    input.backlogStateOrder,
  );

  return (
    baselineStateIndex !== null &&
    finalStateIndex !== null &&
    finalStateIndex > baselineStateIndex
  );
}

function hasTacProgressFromBaseline(input: EvaluateStoryGoalStatusInput): boolean {
  const targetTags = parseGoalTagNames(input.targetTacTagName);
  if (targetTags.length === 0) return false;

  const baselineTags = new Set(
    parseGoalTagNames(input.baselineTacTagName).map((tag) => normalizeText(tag)),
  );
  const finalTags = resolveFinalTagNames(input).map((tag) => normalizeText(tag));

  return finalTags.some((tag) => tag && !baselineTags.has(tag));
}

function isGoalPartiallyMet(input: EvaluateStoryGoalStatusInput): boolean {
  if (isTargetAchieved(input)) return false;

  const stateRequired = Boolean(input.targetStateName?.trim());
  const tacRequired = parseGoalTagNames(input.targetTacTagName).length > 0;
  const stateMet = isStateTargetMet(input);
  const tacMet = isTacTargetMet(input);

  if (stateRequired && tacRequired) {
    return stateMet || tacMet || hasStateProgressFromBaseline(input) || hasTacProgressFromBaseline(input);
  }

  if (stateRequired) {
    return hasStateProgressFromBaseline(input);
  }

  if (tacRequired) {
    return hasTacProgressFromBaseline(input);
  }

  return false;
}

export function evaluateSprintStoryGoalStatus(
  input: EvaluateStoryGoalStatusInput,
): SprintStoryGoalStatus {
  if (!input.includedInGoal) return "excluded";
  if (!isTargetDefined(input.targetStateName, input.targetTacTagName)) return "no_target";
  if (isTargetAchieved(input)) return "achieved";
  if (isGoalPartiallyMet(input)) return "partial";
  return "missed";
}
