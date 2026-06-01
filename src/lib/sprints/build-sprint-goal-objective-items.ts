import type { SprintGoalObjectiveItem } from "@/lib/sprints/sprint-stats-types";
import type { SprintStoryGoalStatus } from "@/lib/sprints/sprint-snapshot-types";

const COMMITTED_STATUSES = new Set<SprintStoryGoalStatus>(["achieved", "partial", "missed"]);

const STATUS_SORT_ORDER: Record<SprintStoryGoalStatus, number> = {
  missed: 0,
  partial: 1,
  achieved: 2,
  excluded: 3,
  no_target: 4,
};

export type SprintGoalObjectiveStorySource = {
  workItemId: number;
  title: string;
  assignedTo: string | null;
  effort: number | null;
  includedInGoal: boolean;
  goalStatus: SprintStoryGoalStatus;
  targetStateName: string | null;
  targetTacTagName: string | null;
  finalStateName: string | null;
  finalTacTagName: string | null;
};

export function buildSprintGoalObjectiveItems(
  stories: readonly SprintGoalObjectiveStorySource[],
): SprintGoalObjectiveItem[] {
  return stories
    .filter(
      (story) => story.includedInGoal && COMMITTED_STATUSES.has(story.goalStatus),
    )
    .map((story) => ({
      workItemId: story.workItemId,
      title: story.title,
      assignedTo: story.assignedTo,
      effort: story.effort,
      goalStatus: story.goalStatus,
      targetStateName: story.targetStateName,
      targetTacTagName: story.targetTacTagName,
      finalStateName: story.finalStateName,
      finalTacTagName: story.finalTacTagName,
    }))
    .sort((left, right) => {
      const statusOrder =
        STATUS_SORT_ORDER[left.goalStatus] - STATUS_SORT_ORDER[right.goalStatus];
      if (statusOrder !== 0) return statusOrder;
      return left.title.localeCompare(right.title, "es");
    });
}
