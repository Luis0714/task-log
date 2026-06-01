import { SITE_NAME } from "@/lib/seo/site";
import { formatSprintDateRange } from "@/lib/time-log/format-options";
import type { SprintStoryGoalRowModel } from "@/lib/sprints/sprint-story-goal";
import type {
  SprintGoalShareContext,
  SprintGoalSharePayload,
  SprintGoalShareStoryRow,
} from "@/lib/sprints/sprint-goal-share-types";
import { SPRINT_GOAL_SHARE_MAX_RENDERED_STORIES } from "@/lib/sprints/sprint-goal-share-types";

type GoalStorySource = {
  workItemId: number;
  title: string;
  includedInGoal: boolean;
  targetStateName: string;
  targetTacTagName: string;
};

function isStoryInGoal(source: GoalStorySource): boolean {
  if (!source.includedInGoal) return false;
  return Boolean(source.targetStateName.trim() || source.targetTacTagName.trim());
}

function toShareStoryRow(source: GoalStorySource): SprintGoalShareStoryRow {
  const targetState = source.targetStateName.trim();
  const targetTac = source.targetTacTagName.trim();

  return {
    workItemId: source.workItemId,
    title: source.title.trim(),
    targetState: targetState || "—",
    targetTac: targetTac || "—",
  };
}

function sortShareStories(
  left: SprintGoalShareStoryRow,
  right: SprintGoalShareStoryRow,
): number {
  return left.workItemId - right.workItemId;
}

function collectUniqueValues(stories: readonly SprintGoalShareStoryRow[], key: "targetState" | "targetTac"): number {
  const values = new Set<string>();

  for (const story of stories) {
    const value = story[key];
    if (value && value !== "—") values.add(value);
  }

  return values.size;
}

function storySourcesFromSavedRows(
  rows: readonly SprintStoryGoalRowModel[],
): GoalStorySource[] {
  return rows.map((row) => ({
    workItemId: row.workItem.id,
    title: row.workItem.title,
    includedInGoal: row.draft.includedInGoal,
    targetStateName: row.draft.targetStateName,
    targetTacTagName: row.draft.targetTacTagName,
  }));
}

function buildPayloadFromSources(
  sources: readonly GoalStorySource[],
  context: SprintGoalShareContext,
  generatedAt: Date,
): SprintGoalSharePayload | null {
  const storiesInGoal = sources
    .filter(isStoryInGoal)
    .map(toShareStoryRow)
    .sort(sortShareStories);

  if (storiesInGoal.length === 0) return null;

  const visibleStories = storiesInGoal.slice(0, SPRINT_GOAL_SHARE_MAX_RENDERED_STORIES);
  const overflowCount = Math.max(storiesInGoal.length - visibleStories.length, 0);

  return {
    generatedAt,
    platformName: SITE_NAME,
    projectName: context.projectName.trim(),
    teamName: context.teamName.trim(),
    sprintName: context.sprintName.trim(),
    sprintDateRange: formatSprintDateRange(context.sprintStartDate, context.sprintFinishDate),
    generalObjective: context.generalObjective.trim(),
    summary: {
      totalStoriesInGoal: storiesInGoal.length,
      uniqueTargetStates: collectUniqueValues(storiesInGoal, "targetState"),
      uniqueTargetTacs: collectUniqueValues(storiesInGoal, "targetTac"),
    },
    visibleStories,
    overflowCount,
    scopeLabel: `${context.projectName.trim()} · ${context.teamName.trim()} · ${context.sprintName.trim()}`,
  };
}

export function buildSprintGoalSharePayloadFromRows(
  rows: readonly SprintStoryGoalRowModel[],
  context: SprintGoalShareContext,
  generatedAt: Date = new Date(),
): SprintGoalSharePayload | null {
  return buildPayloadFromSources(storySourcesFromSavedRows(rows), context, generatedAt);
}
