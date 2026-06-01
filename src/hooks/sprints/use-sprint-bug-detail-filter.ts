"use client";

import { useEffect, useMemo, useState } from "react";

import {
  describeSprintBugDetailFilter,
  filterSprintBugDetailItems,
  isSprintBugDetailFilterValueSelected,
  toggleSprintBugDetailFilterValue,
  type SprintBugDetailFilter,
} from "@/lib/sprints/filter-sprint-bug-detail-items";
import type { SprintBugDetailItem } from "@/lib/sprints/sprint-stats-types";

export function useSprintBugDetailFilter(items: readonly SprintBugDetailItem[]) {
  const [detailFilter, setDetailFilter] = useState<SprintBugDetailFilter | null>(null);

  const itemsKey = useMemo(
    () => items.map((item) => item.workItemId).join(","),
    [items],
  );

  useEffect(() => {
    setDetailFilter(null);
  }, [itemsKey]);

  const filteredItems = useMemo(
    () => filterSprintBugDetailItems(items, detailFilter),
    [items, detailFilter],
  );

  const selectedStateKeys = detailFilter?.kind === "state" ? detailFilter.values : [];

  function toggleStateFilter(state: string) {
    setDetailFilter((current) => toggleSprintBugDetailFilterValue(current, "state", state));
  }

  function toggleAssigneeFilter(assignee: string) {
    setDetailFilter((current) => toggleSprintBugDetailFilterValue(current, "assignee", assignee));
  }

  function clearFilter() {
    setDetailFilter(null);
  }

  function isAssigneeSelected(assignee: string) {
    return isSprintBugDetailFilterValueSelected(detailFilter, "assignee", assignee);
  }

  return {
    detailFilter,
    filteredItems,
    selectedStateKeys,
    toggleStateFilter,
    toggleAssigneeFilter,
    clearFilter,
    isAssigneeSelected,
    filterDescription: detailFilter ? describeSprintBugDetailFilter(detailFilter) : null,
  };
}
