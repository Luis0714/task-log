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

function resolveStateIndex(
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

function isTargetDefined(
  targetStateName: string | null,
  targetTacTagName: string | null,
): boolean {
  return !isSprintStoryGoalDraftEmpty({
    targetStateName: targetStateName ?? "",
    targetTacTagName: targetTacTagName ?? "",
  });
}

function isTargetAchieved(input: EvaluateStoryGoalStatusInput): boolean {
  const targetState = input.targetStateName?.trim() ?? "";
  const targetTac = input.targetTacTagName?.trim() ?? "";
  const finalStateIndex = resolveStateIndex(input.finalStateName, input.backlogStateOrder);
  const targetStateIndex = resolveStateIndex(targetState, input.backlogStateOrder);

  const stateMet =
    Boolean(targetState) &&
    finalStateIndex !== null &&
    targetStateIndex !== null &&
    finalStateIndex >= targetStateIndex;

  const tacMet =
    Boolean(targetTac) &&
    normalizeText(input.finalTacTagName) === normalizeText(targetTac);

  if (targetState && targetTac) return stateMet || tacMet;
  if (targetState) return stateMet;
  if (targetTac) return tacMet;
  return false;
}

function hasProgressFromBaseline(input: EvaluateStoryGoalStatusInput): boolean {
  const baselineStateIndex = resolveStateIndex(
    input.baselineStateName,
    input.backlogStateOrder,
  );
  const finalStateIndex = resolveStateIndex(input.finalStateName, input.backlogStateOrder);

  if (
    baselineStateIndex !== null &&
    finalStateIndex !== null &&
    finalStateIndex > baselineStateIndex
  ) {
    return true;
  }

  const baselineTac = normalizeText(input.baselineTacTagName);
  const finalTac = normalizeText(input.finalTacTagName);
  const targetTac = normalizeText(input.targetTacTagName);

  if (targetTac && finalTac && finalTac !== baselineTac) {
    return true;
  }

  return false;
}

export function evaluateSprintStoryGoalStatus(
  input: EvaluateStoryGoalStatusInput,
): SprintStoryGoalStatus {
  if (!input.includedInGoal) return "excluded";
  if (!isTargetDefined(input.targetStateName, input.targetTacTagName)) return "no_target";
  if (isTargetAchieved(input)) return "achieved";
  if (hasProgressFromBaseline(input)) return "partial";
  return "missed";
}
