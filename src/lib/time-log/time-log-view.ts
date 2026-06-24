export const TIME_LOG_VIEWS = {
  individual: "individual",
  multiple: "multiple",
} as const;

export type TimeLogViewId = keyof typeof TIME_LOG_VIEWS;

export const DEFAULT_TIME_LOG_VIEW: TimeLogViewId = "individual";

const timeLogViewByParam = Object.fromEntries(
  Object.entries(TIME_LOG_VIEWS).map(([id, param]) => [param, id]),
) as Record<string, TimeLogViewId>;

export function parseTimeLogViewParam(
  value: string | null | undefined,
): TimeLogViewId | null {
  if (!value?.trim()) return null;
  return timeLogViewByParam[value.trim()] ?? null;
}

export function timeLogViewToParam(view: TimeLogViewId): string {
  return TIME_LOG_VIEWS[view];
}
