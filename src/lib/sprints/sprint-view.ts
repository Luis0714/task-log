export const SPRINT_VIEWS = {
  stats: "estadisticas",
  goal: "objetivo",
} as const;

export type SprintViewId = keyof typeof SPRINT_VIEWS;

export const DEFAULT_SPRINT_VIEW: SprintViewId = "stats";

const sprintViewByParam = Object.fromEntries(
  Object.entries(SPRINT_VIEWS).map(([id, param]) => [param, id]),
) as Record<string, SprintViewId>;

export function parseSprintViewParam(value: string | null | undefined): SprintViewId | null {
  if (!value?.trim()) return null;
  return sprintViewByParam[value.trim()] ?? null;
}

export function sprintViewToParam(view: SprintViewId): string {
  return SPRINT_VIEWS[view];
}
