"use client";

import { useState, type ReactNode } from "react";

import { SprintItemsDayProvider } from "@/components/sprint-items/sprint-items-day-context";
import { WorkItemsFiltersProvider } from "@/components/work-items/work-items-filters-context";
import type { SprintWorkingDay } from "@/lib/dashboard/sprint-days";
import { SPRINT_DAY_ALL } from "@/lib/sprint-items/filter-by-criteria";

export type SprintItemsSharedProvidersProps = {
  initialAssignee?: string;
  children: ReactNode;
};

export function SprintItemsSharedProviders({
  initialAssignee,
  children,
}: SprintItemsSharedProvidersProps) {
  const [dayKey, setDayKey] = useState(SPRINT_DAY_ALL);
  const [sprintWorkingDays, setSprintWorkingDays] = useState<SprintWorkingDay[]>([]);

  return (
    <WorkItemsFiltersProvider initialAssignee={initialAssignee}>
      <SprintItemsDayProvider
        dayKey={dayKey}
        setDayKey={setDayKey}
        sprintWorkingDays={sprintWorkingDays}
        setSprintWorkingDays={setSprintWorkingDays}
      >
        {children}
      </SprintItemsDayProvider>
    </WorkItemsFiltersProvider>
  );
}
