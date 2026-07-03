"use client";

import { useCallback, useState } from "react";

import {
  DEFAULT_WORK_ITEM_FILTERS,
  type WorkItemFilters,
} from "@/lib/schemas/work-item-filters";

export function useWorkItemFilters(initial?: Partial<WorkItemFilters>) {
  const [filters, setFilters] = useState<WorkItemFilters>({
    ...DEFAULT_WORK_ITEM_FILTERS,
    ...initial,
  });

  const setSearch = useCallback((search: string) => {
    setFilters((current) => ({ ...current, search }));
  }, []);

  const setAssignee = useCallback((assignee: string) => {
    setFilters((current) => ({ ...current, assignee }));
  }, []);

  const setStates = useCallback((states: string[]) => {
    setFilters((current) => ({ ...current, states }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_WORK_ITEM_FILTERS);
  }, []);

  const replaceFilters = useCallback((next: WorkItemFilters) => {
    setFilters(next);
  }, []);

  return {
    filters,
    setSearch,
    setAssignee,
    setStates,
    resetFilters,
    replaceFilters,
  };
}
