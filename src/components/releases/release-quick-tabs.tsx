"use client";

import { PullRequestTabCount } from "@/components/pull-requests/pull-request-tab-count";
import { SegmentedControl } from "@/components/ui/segmented-control";
import type { ReleaseTab } from "@/lib/releases/types";

export type ReleaseQuickTabsProps = {
  value: ReleaseTab;
  totalCount: number;
  pendingCount: number;
  onValueChange: (value: ReleaseTab) => void;
};

export function ReleaseQuickTabs({
  value,
  totalCount,
  pendingCount,
  onValueChange,
}: ReleaseQuickTabsProps) {
  return (
    <SegmentedControl
      items={[
        {
          value: "all",
          label: "Todos",
          badge: <PullRequestTabCount value={totalCount} />,
        },
        {
          value: "pending",
          label: "Pendientes de mi aprobación",
          badge: <PullRequestTabCount value={pendingCount} />,
        },
      ]}
      value={value}
      onValueChange={onValueChange}
      ariaLabel="Filtro de releases"
      size="sm"
      className="max-w-full overflow-x-auto"
    />
  );
}
