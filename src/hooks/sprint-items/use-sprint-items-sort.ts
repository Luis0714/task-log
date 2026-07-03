"use client";

import { useMemo, useState } from "react";

import type { AdoWorkItemOptionDto } from "@/lib/schemas/ado-catalog";
import type { DataTableSortSpec } from "@/lib/data-table/data-table-sort";
import {
  DEFAULT_SPRINT_ITEMS_SORT,
  filterSprintItemsByNameSearch,
  sortSprintItems,
  type SprintSortField,
} from "@/lib/sprint-items/sprint-items-sort";

export function useSprintItemsSort(items: AdoWorkItemOptionDto[]) {
  const [sort, setSort] = useState<DataTableSortSpec<SprintSortField>>(
    DEFAULT_SPRINT_ITEMS_SORT,
  );
  const [nameSearch, setNameSearch] = useState("");

  const processedItems = useMemo(() => {
    const searched = filterSprintItemsByNameSearch(items, nameSearch);
    return sortSprintItems(searched, sort);
  }, [items, nameSearch, sort]);

  return { sort, setSort, nameSearch, setNameSearch, processedItems };
}
