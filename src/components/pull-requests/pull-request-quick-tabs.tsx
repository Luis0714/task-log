"use client";

import { SegmentedControl } from "@/components/ui/segmented-control";
import type { PullRequestTab } from "@/lib/pull-requests/types";

const TAB_ITEMS = [
  { value: "all", label: "Todos" },
  { value: "mine", label: "Mis PRs" },
  { value: "to_review", label: "Por revisar" },
  { value: "pending", label: "Pendientes" },
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
      ariaLabel="Filtro rápido de pull requests"
      size="sm"
      fullWidth
      className="overflow-x-auto"
    />
  );
}
