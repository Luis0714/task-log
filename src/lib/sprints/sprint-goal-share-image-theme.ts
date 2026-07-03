import type { SprintGoalSharePayload } from "@/lib/sprints/sprint-goal-share-types";
import { truncateSprintGoalShareText } from "@/lib/sprints/format-sprint-goal-share";
import { sprintGoalShareTheme } from "@/lib/sprints/sprint-goal-share-theme";

export const SPRINT_GOAL_SHARE_IMAGE_WIDTH = 1600;

export const SPRINT_GOAL_SHARE_IMAGE_LAYOUT = {
  headerHeight: 168,
  summaryHeight: 220,
  tableHeaderHeight: 44,
  tableRowHeight: 60,
  overflowHeight: 36,
  footerHeight: 96,
  horizontalPadding: 48,
} as const;

/** Alias de tema para componentes de imagen OG. */
export const sprintGoalShareImageColors = {
  background: sprintGoalShareTheme.background,
  card: sprintGoalShareTheme.card,
  border: sprintGoalShareTheme.border,
  text: sprintGoalShareTheme.text,
  muted: sprintGoalShareTheme.muted,
  brand: sprintGoalShareTheme.brand,
  tableHeader: sprintGoalShareTheme.surfaceMuted,
} as const;

export { truncateSprintGoalShareText };

export function computeSprintGoalShareImageHeight(payload: SprintGoalSharePayload): number {
  const overflowHeight =
    payload.overflowCount > 0 ? SPRINT_GOAL_SHARE_IMAGE_LAYOUT.overflowHeight : 0;

  return (
    SPRINT_GOAL_SHARE_IMAGE_LAYOUT.headerHeight +
    SPRINT_GOAL_SHARE_IMAGE_LAYOUT.summaryHeight +
    SPRINT_GOAL_SHARE_IMAGE_LAYOUT.tableHeaderHeight +
    payload.visibleStories.length * SPRINT_GOAL_SHARE_IMAGE_LAYOUT.tableRowHeight +
    overflowHeight +
    SPRINT_GOAL_SHARE_IMAGE_LAYOUT.footerHeight +
    48
  );
}

export function getSprintGoalShareImageSize(payload: SprintGoalSharePayload) {
  return {
    width: SPRINT_GOAL_SHARE_IMAGE_WIDTH,
    height: computeSprintGoalShareImageHeight(payload),
  };
}
