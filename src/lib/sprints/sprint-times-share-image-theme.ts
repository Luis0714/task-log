import type { SprintTimesSharePayload } from "@/lib/sprints/sprint-times-share-types";
import { truncateSprintGoalShareText } from "@/lib/sprints/format-sprint-goal-share";
import { sprintGoalShareTheme } from "@/lib/sprints/sprint-goal-share-theme";

export const SPRINT_TIMES_SHARE_IMAGE_WIDTH = 1200;

const SPRINT_TIMES_SHARE_EXTRA_WEEK_WIDTH = 280;
const SPRINT_TIMES_SHARE_BASE_WEEK_COUNT = 2;

export const SPRINT_TIMES_SHARE_IMAGE_LAYOUT = {
  headerHeight: 168,
  legendHeight: 52,
  tableHeaderHeight: 72,
  subHeaderHeight: 36,
  tableRowHeight: 56,
  footerHeight: 112,
  horizontalPadding: 48,
} as const;

export const sprintTimesShareImageTheme = {
  ...sprintGoalShareTheme,
} as const;

export function computeSprintTimesShareImageHeight(payload: SprintTimesSharePayload): number {
  const rowCount = payload.table.rows.length + 1;

  return (
    SPRINT_TIMES_SHARE_IMAGE_LAYOUT.headerHeight +
    SPRINT_TIMES_SHARE_IMAGE_LAYOUT.legendHeight +
    SPRINT_TIMES_SHARE_IMAGE_LAYOUT.tableHeaderHeight +
    SPRINT_TIMES_SHARE_IMAGE_LAYOUT.subHeaderHeight +
    rowCount * SPRINT_TIMES_SHARE_IMAGE_LAYOUT.tableRowHeight +
    SPRINT_TIMES_SHARE_IMAGE_LAYOUT.footerHeight +
    32
  );
}

/**
 * A partir de la tercera semana el lienzo crece para que cada semana conserve
 * un ancho legible en sprints largos.
 */
export function getSprintTimesShareImageSize(payload: SprintTimesSharePayload) {
  const weekColumns = payload.table.columns.filter(
    (column) => column.kind === "week",
  ).length;
  const extraWeeks = Math.max(0, weekColumns - SPRINT_TIMES_SHARE_BASE_WEEK_COUNT);

  return {
    width: SPRINT_TIMES_SHARE_IMAGE_WIDTH + extraWeeks * SPRINT_TIMES_SHARE_EXTRA_WEEK_WIDTH,
    height: computeSprintTimesShareImageHeight(payload),
  };
}

export { truncateSprintGoalShareText as truncateSprintTimesShareText };
