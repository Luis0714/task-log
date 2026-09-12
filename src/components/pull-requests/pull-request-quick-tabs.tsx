"use client";

import { SegmentedControl } from "@/components/ui/segmented-control";
import type { PullRequestTab } from "@/lib/pull-requests/types";

const TAB_ITEMS = [
  { value: "mine", label: "Míos" },
  { value: "active", label: "Activos" },
  { value: "completed", label: "Completados" },
  { value: "abandoned", label: "Abandonados" },
] as const satisfies ReadonlyArray<{ value: PullRequestTab; label: string }>;

export type PullRequestQuickTabsProps = {
  value: PullRequestTab;
  onValueChange: (value: PullRequestTab) => void;
};

export function PullRequestQuickTabs({
  value,
  onValueChange,
}: PullRequestQuickTabsProps) {
  return (
    <SegmentedControl
      items={TAB_ITEMS}
      value={value}
      onValueChange={onValueChange}
      ariaLabel="Estado del pull request"
      size="sm"
      fullWidth
      className="overflow-x-auto"
    />
  );
}
