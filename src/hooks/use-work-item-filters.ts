"use client";

import { useCallback, useState } from "react";

import {
  DEFAULT_WORK_ITEM_FILTERS,
  type WorkItemFilters,
} from "@/lib/schemas/work-item-filters";

export function useWorkItemFilters() {
  const [filters, setFilters] = useState<WorkItemFilters>(DEFAULT_WORK_ITEM_FILTERS);

  const setSearch = useCallback((search: string) => {
    setFilters((current) => ({ ...current, search }));
  }, []);

  const setAssignedToMe = useCallback((assignedToMe: boolean) => {
    setFilters((current) => ({ ...current, assignedToMe }));
  }, []);

  const setState = useCallback((state: string) => {
    setFilters((current) => ({ ...current, state }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_WORK_ITEM_FILTERS);
  }, []);

  return {
    filters,
    setSearch,
    setAssignedToMe,
    setState,
    resetFilters,
  };
}
