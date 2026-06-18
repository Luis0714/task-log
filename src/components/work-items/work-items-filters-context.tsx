"use client";

import { createContext, useContext, useTransition, type ReactNode } from "react";

import { useAssigneeFilterFromUrl } from "@/hooks/filters/use-assignee-filter-from-url";
import { useWorkItemFilters } from "@/hooks/use-work-item-filters";
import type { WorkItemFilters } from "@/lib/schemas/work-item-filters";

type WorkItemsFiltersContextValue = ReturnType<typeof useWorkItemFilters> & {
  isAssigneeNavigating: boolean;
  startAssigneeNavigation: (fn: () => void) => void;
};

const WorkItemsFiltersContext = createContext<WorkItemsFiltersContextValue | null>(null);

export type WorkItemsFiltersProviderProps = Readonly<{
  initialFilters?: Partial<WorkItemFilters>;
  children: ReactNode;
}>;

export function WorkItemsFiltersProvider({
  initialFilters,
  children,
}: WorkItemsFiltersProviderProps) {
  const [isAssigneeNavigating, startAssigneeNavigation] = useTransition();
  const { filters, setAssignee, ...filterActions } = useWorkItemFilters(initialFilters);

  const { assigneeForUi } = useAssigneeFilterFromUrl(filters.assignee, setAssignee);

  const value: WorkItemsFiltersContextValue = {
    filters: { ...filters, assignee: assigneeForUi },
    setAssignee,
    ...filterActions,
    isAssigneeNavigating,
    startAssigneeNavigation,
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
