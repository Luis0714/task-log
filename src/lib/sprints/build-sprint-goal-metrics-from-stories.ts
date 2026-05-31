import { buildSprintGoalRiskItems } from "@/lib/sprints/build-sprint-goal-risk-items";
import { collectGoalWorkItemIds } from "@/lib/sprints/build-bug-quality-metrics";
import {
  computeSnapshotGoalAchievementPercent,
  computeSnapshotStoryPointsPercent,
} from "@/lib/sprints/sprint-snapshot-display";
import type {
  SprintSnapshotSummary,
  SprintStorySnapshotData,
} from "@/lib/sprints/sprint-snapshot-types";
import type { SprintGoalMetrics } from "@/lib/sprints/sprint-stats-types";

export function buildSprintGoalMetricsFromStories(
  stories: readonly SprintStorySnapshotData[],
  summary: SprintSnapshotSummary,
  generalObjective?: string | null,
): SprintGoalMetrics {
  return {
    generalObjective: generalObjective?.trim() ?? "",
    summary,
    achievementPercent: computeSnapshotGoalAchievementPercent(summary),
    storyPointsPercent: computeSnapshotStoryPointsPercent(summary),
    riskItems: buildSprintGoalRiskItems(stories),
    goalWorkItemIds: [...collectGoalWorkItemIds(stories)],
  };
}
