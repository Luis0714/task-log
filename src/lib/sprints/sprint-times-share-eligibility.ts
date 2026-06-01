import type { SprintTimesShareVariant } from "@/lib/sprints/sprint-times-share-variant";
import type { SprintTimesMetrics } from "@/lib/sprints/sprint-stats-types";

export function canShareSprintTimes(times: SprintTimesMetrics): boolean {
  return times.weeks.length > 0 && times.rows.length > 0;
}

export function isSprintTimesWeek2Available(times: SprintTimesMetrics): boolean {
  return times.weeks.length >= 2;
}

export function isSprintTimesShareVariantEnabled(
  times: SprintTimesMetrics,
  variant: SprintTimesShareVariant,
): boolean {
  if (variant === "week2") return isSprintTimesWeek2Available(times);
  return canShareSprintTimes(times);
}

export function resolveDefaultSprintTimesShareVariant(): SprintTimesShareVariant {
  return "full";
}

export function resolveSprintTimesShareVariant(
  times: SprintTimesMetrics,
  variant: SprintTimesShareVariant,
): SprintTimesShareVariant {
  if (isSprintTimesShareVariantEnabled(times, variant)) return variant;
  return resolveDefaultSprintTimesShareVariant();
}
