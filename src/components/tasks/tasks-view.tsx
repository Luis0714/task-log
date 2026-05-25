"use client";

import { CopilotErrorAlert } from "@/components/copilot/copilot-error-alert";
import { DashboardSection } from "@/components/dashboard/layout/dashboard-section";
import { SprintDaySelect } from "@/components/sprint-items/sprint-day-select";
import { SprintItemList } from "@/components/sprint-items/sprint-item-list";
import { AdoContextSelectFields } from "@/components/time-log/ado-context-select-fields";
import { WorkItemFiltersPanel } from "@/components/time-log/work-item-filters-panel";
import { useTasksPage } from "@/hooks/tasks/use-tasks-page";

export type TasksViewProps = {
  adoExecutionReady: boolean;
  defaultProject?: string | null;
};

export function TasksView({
  adoExecutionReady,
  defaultProject = null,
}: TasksViewProps) {
  const { loading, error, sprintName, context, sprintDay, filters, tasks } = useTasksPage({
    adoExecutionReady,
    defaultProject,
  });

  return (
    <div className="flex w-full flex-col gap-8 pb-6">
      <header className="space-y-1">
        <h1 className="font-heading text-xl font-semibold tracking-tight sm:text-2xl">Tasks</h1>
        <p className="text-muted-foreground text-sm text-pretty">
          Tasks del sprint con filtros por asignación, estado y día de trabajo.
          {sprintName ? ` Sprint: ${sprintName}.` : null}
        </p>
      </header>

      {!adoExecutionReady ? (
        <CopilotErrorAlert message="Conecta Azure DevOps para ver tus tasks del sprint." />
      ) : null}

      {error ? <CopilotErrorAlert message={error} /> : null}

      {adoExecutionReady ? (
        <DashboardSection
          title="Contexto"
          description="Proyecto, equipo, sprint y día para cargar las tasks."
        >
          <AdoContextSelectFields
            {...context}
            sprintDayFilter={
              sprintDay.workingDays.length > 0 ? (
                <SprintDaySelect
                  showLabel
                  value={sprintDay.value}
                  workingDays={sprintDay.workingDays}
                  disabled={loading}
                  className="w-full sm:min-w-48 sm:flex-1"
                  onValueChange={sprintDay.onValueChange}
                />
              ) : null
            }
          />
        </DashboardSection>
      ) : null}

      {adoExecutionReady ? (
        <WorkItemFiltersPanel
          title="Filtros"
          filters={filters.values}
          states={filters.states}
          members={filters.members}
          membersLoading={filters.membersLoading}
          membersError={filters.membersError}
          filteredCount={filters.filteredCount}
          totalCount={filters.totalCount}
          disabled={loading || !context.sprintPath}
          onSearchChange={filters.onSearchChange}
          onAssigneeChange={filters.onAssigneeChange}
          onStateChange={filters.onStateChange}
        />
      ) : null}

      <DashboardSection
        title="Tasks del sprint"
        description="Todas las tasks que coinciden con los filtros."
      >
        <SprintItemList
          items={tasks}
          loading={loading}
          emptyMessage="No hay tasks que coincidan con los filtros."
        />
      </DashboardSection>
    </div>
  );
}
