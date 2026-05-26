"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";

import { CopilotErrorAlert } from "@/components/copilot/copilot-error-alert";
import { AdoFiltersSection } from "@/components/filters/ado-filters-section";
import { SprintDaySelect } from "@/components/filters/sprint-day-select";
import { SprintItemsDayProvider } from "@/components/sprint-items/sprint-items-day-context";
import { useAdoFilteredPage } from "@/hooks/filters/use-ado-filtered-page";
import type { AdoCatalogSnapshot } from "@/lib/ado/types";
import {
  listSprintWorkingDays,
  pickDefaultSprintDayKey,
} from "@/lib/dashboard/sprint-days";
import type { AdoFilterMeta } from "@/lib/filters/ado-filter-meta";
import { SPRINT_DAY_ALL } from "@/lib/sprint-items/filter-by-criteria";

export type AdoFilteredPageShellProps = {
  title: string;
  description: string;
  notReadyMessage: string;
  catalog: AdoCatalogSnapshot;
  filterMeta: AdoFilterMeta;
  adoExecutionReady: boolean;
  headerAction?: ReactNode;
  workItemsCount?: number;
  sprintDayFilter?: boolean;
  nonWorkingDates?: readonly string[];
  children?: ReactNode;
};

export function AdoFilteredPageShell({
  title,
  description,
  notReadyMessage,
  catalog,
  filterMeta,
  adoExecutionReady,
  headerAction,
  workItemsCount = 0,
  sprintDayFilter = false,
  nonWorkingDates = [],
  children = null,
}: AdoFilteredPageShellProps) {
  const { context, currentSprint, filtersPanel, catalogError } = useAdoFilteredPage({
    catalog,
    filterMeta,
    adoExecutionReady,
    workItemsCount,
  });

  const [dayKey, setDayKey] = useState(SPRINT_DAY_ALL);

  const sprintWorkingDays = useMemo(
    () =>
      listSprintWorkingDays(
        currentSprint?.startDate,
        currentSprint?.finishDate,
        { nonWorkingDates: new Set(nonWorkingDates) },
      ),
    [currentSprint?.finishDate, currentSprint?.startDate, nonWorkingDates],
  );

  const showSprintDayFilter = sprintDayFilter && adoExecutionReady;

  useEffect(() => {
    if (!showSprintDayFilter) return;
    setDayKey(SPRINT_DAY_ALL);
  }, [catalog.sprintPath, showSprintDayFilter]);

  useEffect(() => {
    if (!showSprintDayFilter) return;
    const defaultKey = pickDefaultSprintDayKey(sprintWorkingDays);
    setDayKey((current) => {
      if (current === SPRINT_DAY_ALL) return current;
      const stillValid =
        current === SPRINT_DAY_ALL ||
        sprintWorkingDays.some((day) => day.value === current);
      return stillValid ? current : defaultKey || SPRINT_DAY_ALL;
    });
  }, [catalog.sprintPath, sprintWorkingDays, showSprintDayFilter]);

  const filtersContext = showSprintDayFilter
    ? {
        ...context,
        sprintDayFilter:
          sprintWorkingDays.length > 0 ? (
            <SprintDaySelect
              showLabel
              includeAllDays
              value={dayKey}
              workingDays={sprintWorkingDays}
              className="w-full"
              onValueChange={setDayKey}
            />
          ) : null,
      }
    : context;

  const body = showSprintDayFilter ? (
    <SprintItemsDayProvider
      dayKey={dayKey}
      setDayKey={setDayKey}
      sprintWorkingDays={sprintWorkingDays}
    >
      {children}
    </SprintItemsDayProvider>
  ) : (
    children
  );

  return (
    <div className="flex w-full flex-col gap-8 pb-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          <h1 className="font-heading text-xl font-semibold tracking-tight sm:text-2xl">
            {title}
          </h1>
          <p className="text-muted-foreground text-sm text-pretty">
            {description}
            {currentSprint?.name ? ` Sprint: ${currentSprint.name}.` : null}
          </p>
        </div>
        {headerAction ? (
          <div className="shrink-0 self-start sm:self-center">{headerAction}</div>
        ) : null}
      </header>

      {!adoExecutionReady ? <CopilotErrorAlert message={notReadyMessage} /> : null}
      {catalogError ? <CopilotErrorAlert message={catalogError} /> : null}

      {adoExecutionReady ? (
        <AdoFiltersSection
          context={filtersContext}
          workItems={{
            filters: filtersPanel.values,
            states: filtersPanel.states,
            members: filtersPanel.members,
            membersLoading: filtersPanel.membersLoading,
            membersError: filtersPanel.membersError,
            filteredCount: filtersPanel.filteredCount,
            totalCount: filtersPanel.totalCount,
            disabled: !catalog.sprintPath,
            title: "Filtros",
            onSearchChange: filtersPanel.onSearchChange,
            onAssigneeChange: filtersPanel.onAssigneeChange,
            onStateChange: filtersPanel.onStateChange,
          }}
          defaultOpen={false}
        />
      ) : null}

      {body}
    </div>
  );
}
