import type { SprintSnapshotData } from "@/lib/sprints/sprint-snapshot-types";
import { parseSprintSnapshotStatsPayloadFromApi } from "@/lib/sprints/parse-sprint-snapshot-stats-payload";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function parseSprintSnapshotFromApi(value: unknown): SprintSnapshotData | null {
  if (!isRecord(value)) return null;

  const stories = Array.isArray(value.stories) ? value.stories : [];
  const summary = isRecord(value.summary) ? value.summary : {};

  const finalizedAtRaw = value.finalizedAt;
  const finalizedAt =
    typeof finalizedAtRaw === "string" || finalizedAtRaw instanceof Date
      ? new Date(finalizedAtRaw)
      : new Date();

  return {
    id: String(value.id ?? ""),
    version: Number(value.version ?? 1),
    finalizedAt,
    finalizedByUserId:
      typeof value.finalizedByUserId === "string" ? value.finalizedByUserId : null,
    finalizedByDisplayName:
      typeof value.finalizedByDisplayName === "string"
        ? value.finalizedByDisplayName
        : null,
    source: value.source === "auto" ? "auto" : "manual",
    generalObjective:
      typeof value.generalObjective === "string" ? value.generalObjective : null,
    sprintName: typeof value.sprintName === "string" ? value.sprintName : null,
    sprintStartDate:
      typeof value.sprintStartDate === "string" ? value.sprintStartDate : null,
    sprintFinishDate:
      typeof value.sprintFinishDate === "string" ? value.sprintFinishDate : null,
    summary: {
      goalsTotalCount: Number(summary.goalsTotalCount ?? 0),
      goalsAchievedCount: Number(summary.goalsAchievedCount ?? 0),
      goalsPartialCount: Number(summary.goalsPartialCount ?? 0),
      goalsMissedCount: Number(summary.goalsMissedCount ?? 0),
      goalsExcludedCount: Number(summary.goalsExcludedCount ?? 0),
      goalsNoTargetCount: Number(summary.goalsNoTargetCount ?? 0),
      storyPointsInGoal: Number(summary.storyPointsInGoal ?? 0),
      storyPointsAchieved: Number(summary.storyPointsAchieved ?? 0),
    },
    stories: stories
      .filter(isRecord)
      .map((story) => ({
        workItemId: Number(story.workItemId ?? 0),
        title: String(story.title ?? ""),
        assignedTo: typeof story.assignedTo === "string" ? story.assignedTo : null,
        effort: story.effort === null || story.effort === undefined ? null : Number(story.effort),
        includedInGoal: Boolean(story.includedInGoal ?? true),
        baselineStateName:
          typeof story.baselineStateName === "string" ? story.baselineStateName : null,
        baselineTacTagName:
          typeof story.baselineTacTagName === "string" ? story.baselineTacTagName : null,
        targetStateName:
          typeof story.targetStateName === "string" ? story.targetStateName : null,
        targetTacTagName:
          typeof story.targetTacTagName === "string" ? story.targetTacTagName : null,
        finalStateName:
          typeof story.finalStateName === "string" ? story.finalStateName : null,
        finalTacTagName:
          typeof story.finalTacTagName === "string" ? story.finalTacTagName : null,
        goalStatus: parseGoalStatus(story.goalStatus),
        observation: typeof story.observation === "string" ? story.observation : null,
      }))
      .filter((story) => story.workItemId > 0 && story.title.length > 0),
    statsPayload: parseSprintSnapshotStatsPayloadFromApi(value.statsPayload),
  };
}

function parseGoalStatus(value: unknown): SprintSnapshotData["stories"][number]["goalStatus"] {
  if (
    value === "achieved" ||
    value === "partial" ||
    value === "missed" ||
    value === "excluded" ||
    value === "no_target"
  ) {
    return value;
  }
  return "no_target";
}
