"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";

import { CopilotErrorAlert } from "@/components/copilot/copilot-error-alert";
import { AdoFiltersSection } from "@/components/filters/ado-filters-section";
import { PageHeader } from "@/components/layout/page-header";
import { SprintDaySelect } from "@/components/filters/sprint-day-select";
import { useSprintItemsDayContext } from "@/components/sprint-items/sprint-items-day-context";
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

  const sprintDayContext = useSprintItemsDayContext();
  const [fallbackDayKey, setFallbackDayKey] = useState(SPRINT_DAY_ALL);

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
  const dayKey =
    showSprintDayFilter && sprintDayContext ? sprintDayContext.dayKey : fallbackDayKey;
  const setDayKey =
    showSprintDayFilter && sprintDayContext
      ? sprintDayContext.setDayKey
      : setFallbackDayKey;

  useEffect(() => {
    if (!showSprintDayFilter || !sprintDayContext) return;
    sprintDayContext.setSprintWorkingDays(sprintWorkingDays);
  }, [showSprintDayFilter, sprintDayContext, sprintWorkingDays]);

  useEffect(() => {
    if (!showSprintDayFilter) return;
    setDayKey(SPRINT_DAY_ALL);
  }, [catalog.sprintPath, setDayKey, showSprintDayFilter]);

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
  }, [catalog.sprintPath, setDayKey, sprintWorkingDays, showSprintDayFilter]);

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

  return (
    <div className="flex w-full flex-col gap-6">
      <PageHeader title={title} description={description} action={headerAction} />

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
            onStatesChange: filtersPanel.onStatesChange,
            onSaveAsDefaults: filtersPanel.onSaveAsDefaults,
          }}
          defaultOpen={false}
        />
      ) : null}

      {children}
    </div>
  );
}
