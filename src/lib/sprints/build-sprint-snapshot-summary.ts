import type {
  SprintSnapshotSummary,
  SprintStoryGoalStatus,
  SprintStorySnapshotData,
} from "@/lib/sprints/sprint-snapshot-types";

const GOAL_STATUS_FIELD: Record<
  SprintStoryGoalStatus,
  keyof Pick<
    SprintSnapshotSummary,
    | "goalsAchievedCount"
    | "goalsPartialCount"
    | "goalsMissedCount"
    | "goalsExcludedCount"
    | "goalsNoTargetCount"
  >
> = {
  achieved: "goalsAchievedCount",
  partial: "goalsPartialCount",
  missed: "goalsMissedCount",
  excluded: "goalsExcludedCount",
  no_target: "goalsNoTargetCount",
};

function isCountableGoalStory(story: SprintStorySnapshotData): boolean {
  return story.includedInGoal && story.goalStatus !== "excluded" && story.goalStatus !== "no_target";
}

export function buildSprintSnapshotSummary(
  stories: readonly SprintStorySnapshotData[],
): SprintSnapshotSummary {
  const summary: SprintSnapshotSummary = {
    goalsTotalCount: 0,
    goalsAchievedCount: 0,
    goalsPartialCount: 0,
    goalsMissedCount: 0,
    goalsExcludedCount: 0,
    goalsNoTargetCount: 0,
    storyPointsInGoal: 0,
    storyPointsAchieved: 0,
  };

  for (const story of stories) {
    summary[GOAL_STATUS_FIELD[story.goalStatus]] += 1;

    if (story.goalStatus === "achieved" || story.goalStatus === "partial" || story.goalStatus === "missed") {
      summary.goalsTotalCount += 1;
    }

    if (!isCountableGoalStory(story)) continue;

    const effort = story.effort ?? 0;
    summary.storyPointsInGoal += effort;

    if (story.goalStatus === "achieved") {
      summary.storyPointsAchieved += effort;
    }
  }

  summary.storyPointsInGoal = Math.round(summary.storyPointsInGoal * 10) / 10;
  summary.storyPointsAchieved = Math.round(summary.storyPointsAchieved * 10) / 10;

  return summary;
}
