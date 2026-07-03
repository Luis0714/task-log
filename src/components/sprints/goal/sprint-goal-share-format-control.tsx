"use client";

import type { ReactNode } from "react";
import { FileText, ImageIcon } from "lucide-react";

import { SegmentedControl } from "@/components/ui/segmented-control";
import {
  SPRINT_GOAL_SHARE_FORMAT_ITEMS,
  type SprintGoalShareFormat,
} from "@/lib/sprints/sprint-goal-share-format";

const FORMAT_ICONS: Record<SprintGoalShareFormat, ReactNode> = {
  image: <ImageIcon />,
  pdf: <FileText />,
};

const FORMAT_ICON_CLASS: Record<SprintGoalShareFormat, string> = {
  image: "text-primary",
  pdf: "text-orange-600 dark:text-orange-400",
};

export type SprintGoalShareFormatControlProps = {
  format: SprintGoalShareFormat;
  disabled?: boolean;
  onFormatChange: (format: SprintGoalShareFormat) => void;
};

export function SprintGoalShareFormatControl({
  format,
  disabled = false,
  onFormatChange,
}: SprintGoalShareFormatControlProps) {
  const items = SPRINT_GOAL_SHARE_FORMAT_ITEMS.map((item) => ({
    ...item,
    disabled,
    icon: FORMAT_ICONS[item.value],
    iconClassName: FORMAT_ICON_CLASS[item.value],
  }));

  return (
    <SegmentedControl
      items={items}
      value={format}
      onValueChange={onFormatChange}
      ariaLabel="Formato de exportación"
      fullWidth
    />
  );
}
