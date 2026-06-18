"use client";

import { useRouter } from "next/navigation";

import { SprintItemsLists } from "@/components/sprint-items/sprint-items-lists";
import { SprintItemsListSkeleton } from "@/components/skeletons/sprint-items-list-skeleton";
import { useSprintItemsDay } from "@/components/sprint-items/sprint-items-day-context";
import { useWorkItemsFiltersContext } from "@/components/work-items/work-items-filters-context";
import type { AdoCatalogSnapshot } from "@/lib/ado/types";
import type { SprintItemsDataSnapshot } from "@/lib/sprint-items/load-sprint-items-data-types";
import type { SprintItemsKind } from "@/lib/sprint-items/types";

export type SprintItemsListsBridgeProps = {
  kind: SprintItemsKind;
  catalog: AdoCatalogSnapshot;
  snapshot: SprintItemsDataSnapshot;
};

export function SprintItemsListsBridge({
  kind,
  catalog,
  snapshot,
}: SprintItemsListsBridgeProps) {
  const router = useRouter();
  const onSaved = () => router.refresh();
  const { filters, isAssigneeNavigating } = useWorkItemsFiltersContext();
  const { dayKey, sprintWorkingDays } = useSprintItemsDay();

  if (isAssigneeNavigating) {
    return <SprintItemsListSkeleton />;
  }

  return (
    <SprintItemsLists
      kind={kind}
      snapshot={snapshot}
      filters={filters}
      dayKey={dayKey}
      sprintWorkingDays={sprintWorkingDays}
      project={catalog.project || null}
      onSaved={onSaved}
    />
  );
}
