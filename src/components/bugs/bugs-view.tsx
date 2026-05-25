"use client";

import { useCallback, useState } from "react";

import { BugDetailSheet } from "@/components/bugs/bug-detail-sheet";
import { CopilotErrorAlert } from "@/components/copilot/copilot-error-alert";
import { DashboardSection } from "@/components/dashboard/layout/dashboard-section";
import { SprintDaySelect } from "@/components/sprint-items/sprint-day-select";
import { SprintItemList } from "@/components/sprint-items/sprint-item-list";
import { AdoFiltersSection } from "@/components/filters/ado-filters-section";
import { useBugsPage } from "@/hooks/bugs/use-bugs-page";
import type { AdoWorkItemOptionDto } from "@/lib/schemas/ado-catalog";

export type BugsViewProps = {
  adoExecutionReady: boolean;
  defaultProject?: string | null;
};

export function BugsView({
  adoExecutionReady,
  defaultProject = null,
}: BugsViewProps) {
  const {
    loading,
    error,
    sprintName,
    project,
    itemStates,
    refetchItems,
    context,
    sprintDay,
    filters,
    bugs,
  } = useBugsPage({
    adoExecutionReady,
    defaultProject,
  });

  const [selectedBug, setSelectedBug] = useState<AdoWorkItemOptionDto | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const handleBugClick = useCallback((item: AdoWorkItemOptionDto) => {
    setSelectedBug(item);
    setSheetOpen(true);
  }, []);

  const handleSheetOpenChange = useCallback((open: boolean) => {
    setSheetOpen(open);
    if (!open) setSelectedBug(null);
  }, []);

  return (
    <div className="flex w-full flex-col gap-8 pb-6">
      <header className="space-y-1">
        <h1 className="font-heading text-xl font-semibold tracking-tight sm:text-2xl">Bugs</h1>
        <p className="text-muted-foreground text-sm text-pretty">
          Bugs del sprint con filtros por asignación, estado y fecha.
          {sprintName ? ` Sprint: ${sprintName}.` : null}
        </p>
      </header>

      {!adoExecutionReady ? (
        <CopilotErrorAlert message="Conecta Azure DevOps para ver los bugs del sprint." />
      ) : null}

      {error ? <CopilotErrorAlert message={error} /> : null}

      {adoExecutionReady ? (
        <AdoFiltersSection
          context={{
            ...context,
            sprintDayFilter:
              sprintDay.workingDays.length > 0 ? (
                <SprintDaySelect
                  showLabel
                  value={sprintDay.value}
                  workingDays={sprintDay.workingDays}
                  disabled={loading}
                  className="w-full sm:min-w-48 sm:flex-1"
                  onValueChange={sprintDay.onValueChange}
                />
              ) : null,
          }}
          workItems={{
            filters: filters.values,
            states: filters.states,
            members: filters.members,
            membersLoading: filters.membersLoading,
            membersError: filters.membersError,
            filteredCount: filters.filteredCount,
            totalCount: filters.totalCount,
            disabled: loading || !context.sprintPath,
            title: "Filtros",
            onSearchChange: filters.onSearchChange,
            onAssigneeChange: filters.onAssigneeChange,
            onStateChange: filters.onStateChange,
          }}
          defaultOpen={false}
        />
      ) : null}

      <DashboardSection
        title="Bugs del sprint"
        description="Todos los bugs que coinciden con los filtros."
      >
        <SprintItemList
          items={bugs}
          loading={loading}
          emptyMessage="No hay bugs que coincidan con los filtros."
          onItemClick={handleBugClick}
        />
      </DashboardSection>

      <BugDetailSheet
        open={sheetOpen}
        onOpenChange={handleSheetOpenChange}
        bug={selectedBug}
        bugStates={itemStates}
        statesLoading={loading}
        project={project}
        sprintWorkingDays={sprintDay.workingDays}
        onSaved={refetchItems}
      />
    </div>
  );
}
