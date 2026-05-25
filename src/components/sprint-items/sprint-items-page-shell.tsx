"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";

import { CopilotErrorAlert } from "@/components/copilot/copilot-error-alert";
import { AdoFiltersSection } from "@/components/filters/ado-filters-section";
import { SprintDaySelect } from "@/components/filters/sprint-day-select";
import { SprintItemsDayProvider } from "@/components/sprint-items/sprint-items-day-context";
import { useAdoContextUrl } from "@/hooks/use-ado-context-url";
import { useWorkItemFiltersPanel } from "@/hooks/filters/use-work-item-filters-panel";
import {
  useWorkItemsFiltersContext,
  WorkItemsFiltersProvider,
} from "@/components/work-items/work-items-filters-context";
import type { AdoCatalogSnapshot } from "@/lib/ado/types";
import { buildAdoContextQuery } from "@/lib/ado/parse-context-search-params";
import { resolveCurrentSprint } from "@/lib/dashboard/build-dashboard-metrics";
import {
  listSprintWorkingDays,
  pickDefaultSprintDayKey,
} from "@/lib/dashboard/sprint-days";
import { SPRINT_DAY_ALL } from "@/lib/sprint-items/filter-by-criteria";
import type { SprintItemsFilterMeta } from "@/lib/sprint-items/load-sprint-items-filter-meta";
import type { SprintItemsKind } from "@/lib/sprint-items/types";

const PAGE_COPY: Record<
  SprintItemsKind,
  { title: string; description: string; notReadyMessage: string }
> = {
  bugs: {
    title: "Bugs",
    description: "Bugs del sprint con filtros por asignación, estado y fecha.",
    notReadyMessage: "Conecta Azure DevOps para ver los bugs del sprint.",
  },
  tasks: {
    title: "Tasks",
    description: "Tasks del sprint con filtros por asignación, estado y día de trabajo.",
    notReadyMessage: "Conecta Azure DevOps para ver tus tasks del sprint.",
  },
};

export type SprintItemsPageShellProps = {
  kind: SprintItemsKind;
  catalog: AdoCatalogSnapshot;
  filterMeta: SprintItemsFilterMeta;
  nonWorkingDates: readonly string[];
  adoExecutionReady: boolean;
  urlAssignee: string;
  headerAction?: ReactNode;
  children?: ReactNode;
};

function SprintItemsPageShellInner({
  kind,
  catalog,
  filterMeta,
  nonWorkingDates,
  adoExecutionReady,
  headerAction,
  children = null,
}: SprintItemsPageShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const copy = PAGE_COPY[kind];
  const { filters, setSearch, setAssignee, setState, resetFilters } =
    useWorkItemsFiltersContext();

  const [dayKey, setDayKey] = useState(SPRINT_DAY_ALL);

  const context = useAdoContextUrl({
    catalog,
    adoExecutionReady,
    assignee: filters.assignee,
  });

  const currentSprint = useMemo(() => resolveCurrentSprint(catalog), [catalog]);

  const sprintWorkingDays = useMemo(
    () =>
      listSprintWorkingDays(
        currentSprint?.startDate,
        currentSprint?.finishDate,
        { nonWorkingDates: new Set(nonWorkingDates) },
      ),
    [currentSprint?.finishDate, currentSprint?.startDate, nonWorkingDates],
  );

  useEffect(() => {
    setDayKey(SPRINT_DAY_ALL);
  }, [catalog.sprintPath]);

  useEffect(() => {
    const defaultKey = pickDefaultSprintDayKey(sprintWorkingDays);
    setDayKey((current) => {
      if (current === SPRINT_DAY_ALL) return current;
      const stillValid =
        current === SPRINT_DAY_ALL ||
        sprintWorkingDays.some((day) => day.value === current);
      return stillValid ? current : defaultKey || SPRINT_DAY_ALL;
    });
  }, [catalog.sprintPath, sprintWorkingDays]);

  const workItemStates = useMemo(
    () => filterMeta.states.map((state) => state.name),
    [filterMeta.states],
  );

  const filtersPanel = useWorkItemFiltersPanel({
    filters,
    setSearch,
    setAssignee: (value) => {
      setAssignee(value);
      router.push(
        `${pathname}${buildAdoContextQuery({
          project: catalog.project,
          team: catalog.team,
          sprint: catalog.sprintPath,
          assignee: value,
        })}`,
      );
    },
    setState,
    resetFilters,
    sprintPath: catalog.sprintPath,
    items: [],
    stateNames: workItemStates,
    members: filterMeta.members,
    membersLoading: false,
    membersError: null,
    totalCount: 0,
    filteredCount: 0,
  });

  const catalogError =
    catalog.errors.projects ??
    catalog.errors.teams ??
    catalog.errors.sprints ??
    null;

  return (
    <div className="flex w-full flex-col gap-8 pb-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          <h1 className="font-heading text-xl font-semibold tracking-tight sm:text-2xl">
            {copy.title}
          </h1>
          <p className="text-muted-foreground text-sm text-pretty">
            {copy.description}
            {currentSprint?.name ? ` Sprint: ${currentSprint.name}.` : null}
          </p>
        </div>
        {headerAction ? <div className="shrink-0 self-start sm:self-center">{headerAction}</div> : null}
      </header>

      {!adoExecutionReady ? <CopilotErrorAlert message={copy.notReadyMessage} /> : null}

      {catalogError ? <CopilotErrorAlert message={catalogError} /> : null}

      {adoExecutionReady ? (
        <AdoFiltersSection
          context={{
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
          }}
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

      <SprintItemsDayProvider
        dayKey={dayKey}
        setDayKey={setDayKey}
        sprintWorkingDays={sprintWorkingDays}
      >
        {children}
      </SprintItemsDayProvider>
    </div>
  );
}

export function SprintItemsPageShell(props: SprintItemsPageShellProps) {
  return (
    <WorkItemsFiltersProvider initialAssignee={props.urlAssignee}>
      <SprintItemsPageShellInner {...props} />
    </WorkItemsFiltersProvider>
  );
}
