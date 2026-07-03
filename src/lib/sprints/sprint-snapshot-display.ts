import type {
  SprintSnapshotData,
  SprintSnapshotSummary,
  SprintStoryGoalStatus,
  SprintStorySnapshotData,
} from "@/lib/sprints/sprint-snapshot-types";

const finalizedAtFormatter = new Intl.DateTimeFormat("es", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const GOAL_STATUS_LABEL: Record<SprintStoryGoalStatus, string> = {
  achieved: "Cumplida",
  partial: "En proceso",
  missed: "No cumplida",
  excluded: "Excluida",
  no_target: "Sin meta",
};

export function getSprintStoryGoalStatusLabel(status: SprintStoryGoalStatus): string {
  return GOAL_STATUS_LABEL[status];
}

export function formatSnapshotFinalizedAt(finalizedAt: Date | string): string {
  const date = finalizedAt instanceof Date ? finalizedAt : new Date(finalizedAt);
  if (Number.isNaN(date.getTime())) return "";
  return finalizedAtFormatter.format(date);
}

export function formatSnapshotSourceLabel(source: SprintSnapshotData["source"]): string {
  return source === "manual" ? "Cierre manual" : "Cierre automático";
}

export function computeSnapshotGoalAchievementPercent(
  summary: SprintSnapshotSummary,
): number {
  if (summary.goalsTotalCount <= 0) return 0;
  return Math.round((summary.goalsAchievedCount / summary.goalsTotalCount) * 100);
}

export function computeSnapshotStoryPointsPercent(
  summary: SprintSnapshotSummary,
): number {
  if (summary.storyPointsInGoal <= 0) return 0;
  return Math.round((summary.storyPointsAchieved / summary.storyPointsInGoal) * 100);
}

export type SprintSnapshotDisplayRow = SprintStorySnapshotData;

export function listSnapshotDisplayRows(
  snapshot: SprintSnapshotData,
): SprintSnapshotDisplayRow[] {
  return [...snapshot.stories].sort((left, right) =>
    left.title.localeCompare(right.title, "es"),
  );
}

export function countSnapshotGoalsWithTarget(
  stories: readonly SprintStorySnapshotData[],
): number {
  return stories.filter(
    (story) =>
      story.includedInGoal &&
      story.goalStatus !== "excluded" &&
      story.goalStatus !== "no_target",
  ).length;
}
