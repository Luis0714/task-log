"use client";

import { createContext, useContext, type ReactNode } from "react";

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
  const value = useWorkItemFilters(
    initialAssignee ? { assignee: initialAssignee } : undefined,
  );

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
