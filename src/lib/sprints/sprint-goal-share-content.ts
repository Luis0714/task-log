import { truncateSprintGoalShareText } from "@/lib/sprints/format-sprint-goal-share";
import { SPRINT_GOAL_SHARE_LABELS } from "@/lib/sprints/sprint-goal-share-labels";
import type { SprintGoalShareSummary } from "@/lib/sprints/sprint-goal-share-types";

const EMPTY_GENERAL_OBJECTIVE = "Sin objetivo general registrado.";

export type SprintGoalShareMetricItem = {
  label: string;
  value: number;
};

export function getSprintGoalShareObjectiveText(generalObjective: string): string {
  return generalObjective.trim() || EMPTY_GENERAL_OBJECTIVE;
}

export function buildSprintGoalShareMetrics(
  summary: SprintGoalShareSummary,
): SprintGoalShareMetricItem[] {
  return [
    {
      label: SPRINT_GOAL_SHARE_LABELS.storiesInGoal,
      value: summary.totalStoriesInGoal,
    },
    {
      label: SPRINT_GOAL_SHARE_LABELS.stateObjective,
      value: summary.uniqueTargetStates,
    },
    {
      label: SPRINT_GOAL_SHARE_LABELS.tagObjective,
      value: summary.uniqueTargetTags,
    },
  ];
}

export function formatSprintGoalShareOverflowMessage(overflowCount: number): string {
  const storiesLabel =
    overflowCount === 1
      ? SPRINT_GOAL_SHARE_LABELS.overflowStories
      : SPRINT_GOAL_SHARE_LABELS.overflowStoriesPlural;
  const suffixLabel =
    overflowCount === 1
      ? SPRINT_GOAL_SHARE_LABELS.overflowSuffix
      : SPRINT_GOAL_SHARE_LABELS.overflowSuffixPlural;

  return `Y ${overflowCount} ${storiesLabel} ${suffixLabel}`;
}

export function formatSprintGoalShareStoryTitle(
  workItemId: number,
  title: string,
  maxTitleLength: number,
): string {
  return `#${workItemId} · ${truncateSprintGoalShareText(title, maxTitleLength)}`;
}

export function formatSprintGoalShareState(state: string): string {
  return state.trim() || "—";
}

export function formatSprintGoalShareTags(
  tags: readonly string[],
  maxLength = 120,
): string {
  const normalized = tags.map((tag) => tag.trim()).filter(Boolean);
  if (normalized.length === 0) return "—";
  return truncateSprintGoalShareText(normalized.join(", "), maxLength);
}
