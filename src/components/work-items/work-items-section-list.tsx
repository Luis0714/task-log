"use client";

import { DashboardSection } from "@/components/dashboard/layout/dashboard-section";
import { PbiList } from "@/components/dashboard/work-items/pbi-list";
import { useWorkItemsSelection } from "@/components/work-items/work-items-selection-context";
import type { DashboardWorkItem } from "@/lib/dashboard/types";

export type WorkItemsSectionListProps = {
  title: string;
  description?: string;
  items: DashboardWorkItem[];
  variant: "compact" | "featured";
  showHours?: boolean;
  emptyMessage: string;
};

export function WorkItemsSectionList({
  title,
  description,
  items,
  variant,
  showHours = false,
  emptyMessage,
}: WorkItemsSectionListProps) {
  const { onItemClick } = useWorkItemsSelection();

  return (
    <DashboardSection title={title} description={description}>
      <PbiList
        items={items}
        variant={variant}
        showHours={showHours}
        emptyMessage={emptyMessage}
        onItemClick={onItemClick}
      />
    </DashboardSection>
  );
}
