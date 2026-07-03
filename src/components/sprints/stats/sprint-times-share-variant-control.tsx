"use client";

import { useMemo, type ReactNode } from "react";
import { CalendarClock, LayoutGrid } from "lucide-react";

import { SegmentedControl } from "@/components/ui/segmented-control";
import {
  buildSprintTimesShareVariantItems,
  isFullSprintTimesShareVariant,
  isSprintTimesShareVariantSelected,
  type SprintTimesShareVariant,
  type SprintTimesShareVariantSelection,
} from "@/lib/sprints/sprint-times-share-variant";
import type { SprintTimesMetrics } from "@/lib/sprints/sprint-stats-types";

const FULL_VARIANT_ICON = <LayoutGrid />;
const FULL_VARIANT_ICON_CLASS = "text-primary";

function getWeekVariantIcon(_weekIndex: number): ReactNode {
  return <CalendarClock />;
}

function getWeekVariantIconClass(weekIndex: number): string {
  const palette = [
    "text-sky-600 dark:text-sky-400",
    "text-violet-600 dark:text-violet-400",
    "text-emerald-600 dark:text-emerald-400",
    "text-amber-600 dark:text-amber-400",
  ];
  return palette[weekIndex % palette.length];
}

export type SprintTimesShareVariantControlProps = {
  variant: SprintTimesShareVariantSelection;
  times: SprintTimesMetrics;
  disabled?: boolean;
  isVariantEnabled: (variant: SprintTimesShareVariant) => boolean;
  onVariantChange: (variant: SprintTimesShareVariant) => void;
};

export function SprintTimesShareVariantControl({
  variant,
  times,
  disabled = false,
  isVariantEnabled,
  onVariantChange,
}: SprintTimesShareVariantControlProps) {
  const items = useMemo(() => {
    const base = buildSprintTimesShareVariantItems(times);
    return base.map((item, index) => ({
      ...item,
      disabled: disabled || !isVariantEnabled(item.value),
      icon: isFullSprintTimesShareVariant(item.value)
        ? FULL_VARIANT_ICON
        : getWeekVariantIcon(index - 1),
      iconClassName: isFullSprintTimesShareVariant(item.value)
        ? FULL_VARIANT_ICON_CLASS
        : getWeekVariantIconClass(index - 1),
    }));
  }, [times, disabled, isVariantEnabled]);

  const value = isSprintTimesShareVariantSelected(variant) ? variant : "";

  return (
    <SegmentedControl<typeof value>
      items={items as never}
      value={value}
      onValueChange={onVariantChange as never}
      ariaLabel="Resumen de tiempos a compartir"
      fullWidth
    />
  );
}
