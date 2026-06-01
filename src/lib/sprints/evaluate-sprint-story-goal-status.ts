import type { SprintStoryGoalStatus } from "@/lib/sprints/sprint-snapshot-types";
import { isSprintStoryGoalDraftEmpty } from "@/lib/sprints/sprint-story-goal";

export type EvaluateStoryGoalStatusInput = {
  includedInGoal: boolean;
  baselineStateName: string | null;
  baselineTacTagName: string | null;
  targetStateName: string | null;
  targetTacTagName: string | null;
  finalStateName: string | null;
  finalTacTagName: string | null;
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
    targetTacTagName: targetTacTagName ?? "",
  });
}

function isStateTargetMet(input: EvaluateStoryGoalStatusInput): boolean {
  return isStateAtLeastTarget(
    input.finalStateName,
    input.targetStateName,
    input.backlogStateOrder,
  );
}

function isTacTargetMet(input: EvaluateStoryGoalStatusInput): boolean {
  const targetTac = input.targetTacTagName?.trim() ?? "";
  if (!targetTac) return false;
  return normalizeText(input.finalTacTagName) === normalizeText(targetTac);
}

function isTargetAchieved(input: EvaluateStoryGoalStatusInput): boolean {
  const stateRequired = Boolean(input.targetStateName?.trim());
  const tacRequired = Boolean(input.targetTacTagName?.trim());
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
  const targetTac = normalizeText(input.targetTacTagName);
  const finalTac = normalizeText(input.finalTacTagName);
  const baselineTac = normalizeText(input.baselineTacTagName);

  return Boolean(targetTac && finalTac && finalTac !== baselineTac);
}

function isGoalPartiallyMet(input: EvaluateStoryGoalStatusInput): boolean {
  if (isTargetAchieved(input)) return false;

  const stateRequired = Boolean(input.targetStateName?.trim());
  const tacRequired = Boolean(input.targetTacTagName?.trim());
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
