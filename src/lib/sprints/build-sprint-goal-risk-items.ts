import type { SprintGoalRiskItem } from "@/lib/sprints/sprint-stats-types";
import type { SprintStoryGoalStatus } from "@/lib/sprints/sprint-snapshot-types";

const RISK_STATUSES = new Set<SprintStoryGoalStatus>(["missed", "partial"]);
const MAX_RISK_ITEMS = 7;

export type SprintGoalRiskStory = {
  workItemId: number;
  title: string;
  assignedTo: string | null;
  effort: number | null;
  goalStatus: SprintStoryGoalStatus;
  targetStateName: string | null;
  finalStateName: string | null;
};

export function buildSprintGoalRiskItems(
  stories: readonly SprintGoalRiskStory[],
): SprintGoalRiskItem[] {
  return stories
    .filter((story) => RISK_STATUSES.has(story.goalStatus))
    .map((story) => ({
      workItemId: story.workItemId,
      title: story.title,
      assignedTo: story.assignedTo,
      effort: story.effort,
      goalStatus: story.goalStatus,
      targetStateName: story.targetStateName,
      finalStateName: story.finalStateName,
    }))
    .sort((left, right) => {
      if (left.goalStatus !== right.goalStatus) {
        return left.goalStatus === "missed" ? -1 : 1;
      }
      return left.title.localeCompare(right.title, "es");
    })
    .slice(0, MAX_RISK_ITEMS);
}
