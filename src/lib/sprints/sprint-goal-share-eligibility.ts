import type { SprintStorySnapshotData } from "@/lib/sprints/sprint-snapshot-types";

export type SprintGoalEditorShareState = {
  persistenceReady: boolean;
  loading: boolean;
  saving: boolean;
  isDirty: boolean;
  goalsCount: number;
};

function isSnapshotStoryInGoal(story: SprintStorySnapshotData): boolean {
  if (!story.includedInGoal) return false;
  return Boolean(story.targetStateName?.trim() || story.targetTacTagName?.trim());
}

export function canShareSprintGoalFromEditor(
  state: SprintGoalEditorShareState,
): boolean {
  return (
    state.persistenceReady &&
    !state.loading &&
    !state.saving &&
    !state.isDirty &&
    state.goalsCount > 0
  );
}

export function countSnapshotStoriesInGoal(
  stories: readonly SprintStorySnapshotData[],
): number {
  return stories.filter(isSnapshotStoryInGoal).length;
}

export function canShareSnapshotSprintGoal(
  stories: readonly SprintStorySnapshotData[],
): boolean {
  return countSnapshotStoriesInGoal(stories) > 0;
}
