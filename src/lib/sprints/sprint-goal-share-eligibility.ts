import type { SprintStorySnapshotData } from "@/lib/sprints/sprint-snapshot-types";

function isSnapshotStoryInGoal(story: SprintStorySnapshotData): boolean {
  if (!story.includedInGoal) return false;
  return Boolean(story.targetStateName?.trim() || story.targetTacTagName?.trim());
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
