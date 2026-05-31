import type { AdoWorkItemOptionDto, AdoWorkItemTagDto } from "@/lib/schemas/ado-catalog";
import type { SprintStoryGoalRecord } from "@/lib/db/ports/sprint-story-goal.repository.port";
import { buildSprintStorySnapshot } from "@/lib/sprints/build-sprint-story-snapshot";
import { buildSprintSnapshotSummary } from "@/lib/sprints/build-sprint-snapshot-summary";
import {
  computeSnapshotGoalAchievementPercent,
  computeSnapshotStoryPointsPercent,
} from "@/lib/sprints/sprint-snapshot-display";
import { mapGoalsByWorkItemId } from "@/lib/sprints/merge-sprint-finalize-work-items";
import { buildSprintGoalRiskItems } from "@/lib/sprints/build-sprint-goal-risk-items";
import { collectGoalWorkItemIds } from "@/lib/sprints/build-bug-quality-metrics";
import type { SprintGoalMetrics } from "@/lib/sprints/sprint-stats-types";

export type BuildSprintGoalMetricsInput = {
  workItems: readonly AdoWorkItemOptionDto[];
  goals: readonly SprintStoryGoalRecord[];
  catalogTags: readonly AdoWorkItemTagDto[];
  backlogStateOrder: readonly string[];
  generalObjective?: string | null;
};

export function buildSprintGoalMetrics(input: BuildSprintGoalMetricsInput): SprintGoalMetrics {
  const goalsByWorkItemId = mapGoalsByWorkItemId(input.goals);

  const stories = input.workItems.map((workItem) =>
    buildSprintStorySnapshot({
      workItem,
      goal: goalsByWorkItemId.get(workItem.id),
      catalogTags: input.catalogTags,
      backlogStateOrder: input.backlogStateOrder,
    }),
  );

  const summary = buildSprintSnapshotSummary(stories);

  return {
    generalObjective: input.generalObjective?.trim() ?? "",
    summary,
    achievementPercent: computeSnapshotGoalAchievementPercent(summary),
    storyPointsPercent: computeSnapshotStoryPointsPercent(summary),
    riskItems: buildSprintGoalRiskItems(stories),
    goalWorkItemIds: [...collectGoalWorkItemIds(stories)],
  };
}
