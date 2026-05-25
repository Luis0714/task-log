"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { useCallback, useState } from "react";

import { CopilotErrorAlert } from "@/components/copilot/copilot-error-alert";
import { DashboardSection } from "@/components/dashboard/layout/dashboard-section";
import { SprintDaySelect } from "@/components/sprint-items/sprint-day-select";
import { SprintItemList } from "@/components/sprint-items/sprint-item-list";
import { TaskDetailSheet } from "@/components/tasks/task-detail-sheet";
import { Button } from "@/components/ui/button";
import { AdoContextSelectFields } from "@/components/time-log/ado-context-select-fields";
import { WorkItemFiltersPanel } from "@/components/time-log/work-item-filters-panel";
import { useTasksPage } from "@/hooks/tasks/use-tasks-page";
import type { AdoWorkItemOptionDto } from "@/lib/schemas/ado-catalog";

export type TasksViewProps = {
  adoExecutionReady: boolean;
  defaultProject?: string | null;
};

export function TasksView({
  adoExecutionReady,
  defaultProject = null,
}: TasksViewProps) {
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
    tasks,
  } = useTasksPage({
    adoExecutionReady,
    defaultProject,
  });

  const [selectedTask, setSelectedTask] = useState<AdoWorkItemOptionDto | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const handleTaskClick = useCallback((item: AdoWorkItemOptionDto) => {
    setSelectedTask(item);
    setSheetOpen(true);
  }, []);

  const handleSheetOpenChange = useCallback((open: boolean) => {
    setSheetOpen(open);
    if (!open) setSelectedTask(null);
  }, []);

  return (
    <div className="flex w-full flex-col gap-8 pb-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          <h1 className="font-heading text-xl font-semibold tracking-tight sm:text-2xl">Tasks</h1>
          <p className="text-muted-foreground text-sm text-pretty">
            Tasks del sprint con filtros por asignación, estado y día de trabajo.
            {sprintName ? ` Sprint: ${sprintName}.` : null}
          </p>
        </div>
        {adoExecutionReady ? (
          <Button
            render={<Link href="/time-log" />}
            nativeButton={false}
            className="shrink-0 self-start sm:self-center"
          >
            <Plus data-icon="inline-start" aria-hidden />
            Nueva task
          </Button>
        ) : null}
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
          onItemClick={handleTaskClick}
        />
      </DashboardSection>

      <TaskDetailSheet
        open={sheetOpen}
        onOpenChange={handleSheetOpenChange}
        task={selectedTask}
        taskStates={itemStates}
        statesLoading={loading}
        project={project}
        sprintWorkingDays={sprintDay.workingDays}
        onSaved={refetchItems}
      />
    </div>
  );
}
