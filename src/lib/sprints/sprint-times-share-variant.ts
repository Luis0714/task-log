import type { SprintTimesMetrics } from "@/lib/sprints/sprint-stats-types";

export type SprintTimesShareVariant =
  | "full"
  | `week${number}`;

const FULL_VARIANT: SprintTimesShareVariant = "full";

export type SprintTimesShareVariantSelection = SprintTimesShareVariant | null;

export function isFullSprintTimesShareVariant(
  variant: SprintTimesShareVariant,
): variant is "full" {
  return variant === FULL_VARIANT;
}

export function isSprintTimesShareVariantSelected(
  selection: SprintTimesShareVariantSelection,
): selection is SprintTimesShareVariant {
  return selection !== null;
}

export function parseSprintTimesShareWeekIndex(
  variant: SprintTimesShareVariant,
): number | null {
  if (variant === FULL_VARIANT) return null;
  const match = /^week(\d+)$/.exec(variant);
  if (!match) return null;
  const index = Number(match[1]);
  return Number.isFinite(index) ? index : null;
}

export function buildSprintTimesShareWeekVariant(index: number): SprintTimesShareVariant {
  return `week${index}`;
}

export function getSprintTimesShareWeekDateRange(
  times: SprintTimesMetrics,
  variant: SprintTimesShareVariant,
): string | null {
  if (isFullSprintTimesShareVariant(variant)) return null;
  const weekIndex = parseSprintTimesShareWeekIndex(variant);
  if (weekIndex === null) return null;
  const week = times.weeks[weekIndex - 1];
  if (!week) return null;
  if (week.dateRangeLabel) return week.dateRangeLabel;
  return week.label || null;
}

export type SprintTimesShareVariantItem = {
  value: SprintTimesShareVariant;
  label: string;
};

export function buildSprintTimesShareVariantItems(
  times: SprintTimesMetrics,
): readonly SprintTimesShareVariantItem[] {
  const items: SprintTimesShareVariantItem[] = [
    { value: FULL_VARIANT, label: "Completo" },
  ];

  times.weeks.forEach((week, index) => {
    items.push({
      value: buildSprintTimesShareWeekVariant(index + 1),
      label: week.label || `Semana ${index + 1}`,
    });
  });

  return items;
}

export function getSprintTimesShareVariantLabel(
  variant: SprintTimesShareVariant,
  times: SprintTimesMetrics,
): string {
  const items = buildSprintTimesShareVariantItems(times);
  return items.find((entry) => entry.value === variant)?.label ?? variant;
}

export const SPRINT_TIMES_SHARE_NO_SELECTION: SprintTimesShareVariantSelection = null;
