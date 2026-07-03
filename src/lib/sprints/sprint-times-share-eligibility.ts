import {
  isFullSprintTimesShareVariant,
  parseSprintTimesShareWeekIndex,
  type SprintTimesShareVariant,
} from "@/lib/sprints/sprint-times-share-variant";
import type { SprintTimesMetrics } from "@/lib/sprints/sprint-stats-types";

export { buildSprintTimesShareWeekVariant } from "@/lib/sprints/sprint-times-share-variant";

export function canShareSprintTimes(times: SprintTimesMetrics): boolean {
  return times.weeks.length > 0 && times.rows.length > 0;
}

export function isSprintTimesShareVariantEnabled(
  times: SprintTimesMetrics,
  variant: SprintTimesShareVariant,
): boolean {
  if (!canShareSprintTimes(times)) return false;
  if (isFullSprintTimesShareVariant(variant)) return true;

  const weekIndex = parseSprintTimesShareWeekIndex(variant);
  if (weekIndex === null) return false;
  return weekIndex >= 1 && weekIndex <= times.weeks.length;
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

export function resolveSprintTimesShareWeekIndex(
  times: SprintTimesMetrics,
  variant: SprintTimesShareVariant,
): number | null {
  if (!isSprintTimesShareVariantEnabled(times, variant)) return null;
  if (isFullSprintTimesShareVariant(variant)) return null;
  return parseSprintTimesShareWeekIndex(variant);
}
