"use client";

import { createContext, useContext, type ReactNode } from "react";

import { useAssigneeFilterFromUrl } from "@/hooks/filters/use-assignee-filter-from-url";
import { useWorkItemFilters } from "@/hooks/use-work-item-filters";
import type { WorkItemFilters } from "@/lib/schemas/work-item-filters";

type WorkItemsFiltersContextValue = ReturnType<typeof useWorkItemFilters>;

const WorkItemsFiltersContext = createContext<WorkItemsFiltersContextValue | null>(null);

export type WorkItemsFiltersProviderProps = {
  initialAssignee?: string;
  children: ReactNode;
};

export function WorkItemsFiltersProvider({
  initialAssignee,
  children,
}: WorkItemsFiltersProviderProps) {
  const { filters, setAssignee, ...filterActions } = useWorkItemFilters(
    initialAssignee ? { assignee: initialAssignee } : undefined,
  );

  const { assigneeForUi } = useAssigneeFilterFromUrl(filters.assignee, setAssignee);

  const value = {
    filters: { ...filters, assignee: assigneeForUi },
    setAssignee,
    ...filterActions,
  };

  return (
    <WorkItemsFiltersContext.Provider value={value}>{children}</WorkItemsFiltersContext.Provider>
  );
}

export function useWorkItemsFiltersContext(): WorkItemsFiltersContextValue {
  const value = useContext(WorkItemsFiltersContext);
  if (!value) {
    throw new Error("useWorkItemsFiltersContext debe usarse dentro de WorkItemsFiltersProvider");
  }
  return value;
}

export type { WorkItemFilters };
