import type { AdoWorkItemOptionDto, AdoWorkItemTagDto } from "@/lib/schemas/ado-catalog";
import type { SprintStoryGoalRecord } from "@/lib/db/ports/sprint-story-goal.repository.port";
import { evaluateSprintStoryGoalStatus } from "@/lib/sprints/evaluate-sprint-story-goal-status";
import {
  resolveBaselineTacTagName,
  resolveSprintStoryGoalBaseline,
} from "@/lib/sprints/sprint-story-goal-baseline";
import type { SprintStorySnapshotData } from "@/lib/sprints/sprint-snapshot-types";

export type BuildSprintStorySnapshotInput = {
  workItem: AdoWorkItemOptionDto;
  goal: SprintStoryGoalRecord | undefined;
  catalogTags: readonly AdoWorkItemTagDto[];
  backlogStateOrder: readonly string[];
};

export function buildSprintStorySnapshot(
  input: BuildSprintStorySnapshotInput,
): SprintStorySnapshotData {
  const { workItem, goal, catalogTags, backlogStateOrder } = input;
  const baseline = goal
    ? {
        baselineStateName: goal.baselineStateName,
        baselineTacTagName: goal.baselineTacTagName,
      }
    : resolveSprintStoryGoalBaseline(workItem, catalogTags, undefined);

  const includedInGoal = goal?.includedInGoal ?? true;
  const targetStateName = goal?.targetStateName ?? null;
  const targetTacTagName = goal?.targetTacTagName ?? null;
  const finalStateName = workItem.state?.trim() || null;
  const finalTacTagName = resolveBaselineTacTagName(workItem.tags, catalogTags);

  const goalStatus = evaluateSprintStoryGoalStatus({
    includedInGoal,
    baselineStateName: baseline.baselineStateName,
    baselineTacTagName: baseline.baselineTacTagName,
    targetStateName,
    targetTacTagName,
    finalStateName,
    finalTacTagName,
    backlogStateOrder,
  });

  return {
    workItemId: workItem.id,
    title: workItem.title,
    assignedTo: workItem.assignedTo?.trim() || null,
    effort: workItem.effort ?? null,
    includedInGoal,
    baselineStateName: baseline.baselineStateName,
    baselineTacTagName: baseline.baselineTacTagName,
    targetStateName,
    targetTacTagName,
    finalStateName,
    finalTacTagName,
    goalStatus,
    observation: goal?.observation ?? null,
  };
}
