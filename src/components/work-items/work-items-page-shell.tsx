"use client";

import { useMemo, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";

import { CopilotErrorAlert } from "@/components/copilot/copilot-error-alert";
import { AdoFiltersSection } from "@/components/filters/ado-filters-section";
import {
  useWorkItemsFiltersContext,
  WorkItemsFiltersProvider,
} from "@/components/work-items/work-items-filters-context";
import { useAdoContextUrl } from "@/hooks/use-ado-context-url";
import { useWorkItemFiltersPanel } from "@/hooks/filters/use-work-item-filters-panel";
import type { AdoCatalogSnapshot } from "@/lib/ado/types";
import { buildAdoContextQuery } from "@/lib/ado/parse-context-search-params";
import { resolveCurrentSprint } from "@/lib/dashboard/build-dashboard-metrics";
import type { WorkItemsFilterMeta } from "@/lib/work-items/load-work-items-filter-meta";

export type WorkItemsPageShellProps = {
  catalog: AdoCatalogSnapshot;
  filterMeta: WorkItemsFilterMeta;
  adoExecutionReady: boolean;
  urlAssignee: string;
  currentUserDisplayName?: string | null;
  children: ReactNode;
};

function WorkItemsPageShellInner({
  catalog,
  filterMeta,
  adoExecutionReady,
  urlAssignee,
  currentUserDisplayName = null,
  children,
}: WorkItemsPageShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { filters, setSearch, setAssignee, setState, resetFilters } =
    useWorkItemsFiltersContext();

  const context = useAdoContextUrl({
    catalog,
    adoExecutionReady,
    assignee: filters.assignee,
    workItemsCount: 0,
  });

  const currentSprint = useMemo(() => resolveCurrentSprint(catalog), [catalog]);

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
      <header className="space-y-1">
        <h1 className="font-heading text-xl font-semibold tracking-tight sm:text-2xl">
          Work Items
        </h1>
        <p className="text-muted-foreground text-sm text-pretty">
          Historias del sprint con filtros por estado, nombre y asignación.
          {currentSprint?.name ? ` Sprint: ${currentSprint.name}.` : null}
        </p>
      </header>

      {!adoExecutionReady ? (
        <CopilotErrorAlert message="Conecta Azure DevOps para ver las historias de usuario del sprint." />
      ) : null}

      {catalogError ? <CopilotErrorAlert message={catalogError} /> : null}

      {adoExecutionReady ? (
        <AdoFiltersSection
          context={context}
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

      {children}
    </div>
  );
}

export function WorkItemsPageShell(props: WorkItemsPageShellProps) {
  return (
    <WorkItemsFiltersProvider initialAssignee={props.urlAssignee}>
      <WorkItemsPageShellInner {...props} />
    </WorkItemsFiltersProvider>
  );
}
