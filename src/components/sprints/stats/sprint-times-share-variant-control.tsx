"use client";

import type { ReactNode } from "react";
import { CalendarClock, CalendarRange, LayoutGrid } from "lucide-react";

import { SegmentedControl } from "@/components/ui/segmented-control";
import {
  SPRINT_TIMES_SHARE_VARIANT_ITEMS,
  type SprintTimesShareVariant,
} from "@/lib/sprints/sprint-times-share-variant";

const VARIANT_ICONS: Record<SprintTimesShareVariant, ReactNode> = {
  full: <LayoutGrid />,
  week1: <CalendarRange />,
  week2: <CalendarClock />,
};

const VARIANT_ICON_CLASS: Record<SprintTimesShareVariant, string> = {
  full: "text-primary",
  week1: "text-sky-600 dark:text-sky-400",
  week2: "text-violet-600 dark:text-violet-400",
};

export type SprintTimesShareVariantControlProps = {
  variant: SprintTimesShareVariant;
  disabled?: boolean;
  isVariantEnabled: (variant: SprintTimesShareVariant) => boolean;
  onVariantChange: (variant: SprintTimesShareVariant) => void;
};

export function SprintTimesShareVariantControl({
  variant,
  disabled = false,
  isVariantEnabled,
  onVariantChange,
}: SprintTimesShareVariantControlProps) {
  const items = SPRINT_TIMES_SHARE_VARIANT_ITEMS.map((item) => ({
    ...item,
    disabled: disabled || !isVariantEnabled(item.value),
    icon: VARIANT_ICONS[item.value],
    iconClassName: VARIANT_ICON_CLASS[item.value],
  }));

  return (
    <SegmentedControl
      items={items}
      value={variant}
      onValueChange={onVariantChange}
      ariaLabel="Resumen de tiempos a compartir"
      fullWidth
    />
  );
}
