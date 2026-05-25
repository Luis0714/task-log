"use client";

import { useCallback, useState } from "react";

import { CopilotErrorAlert } from "@/components/copilot/copilot-error-alert";
import { DashboardSection } from "@/components/dashboard/layout/dashboard-section";
import { PbiList } from "@/components/dashboard/work-items/pbi-list";
import { AdoFiltersSection } from "@/components/filters/ado-filters-section";
import { UserStoryDetailSheet } from "@/components/work-items/user-story-detail-sheet";
import { useWorkItemsPage } from "@/hooks/work-items/use-work-items-page";
import type { DashboardWorkItem } from "@/lib/dashboard/types";

export type WorkItemsViewProps = {
  adoExecutionReady: boolean;
  defaultProject?: string | null;
  currentUserDisplayName?: string | null;
};

export function WorkItemsView({
  adoExecutionReady,
  defaultProject = null,
  currentUserDisplayName = null,
}: WorkItemsViewProps) {
  const {
    loading,
    error,
    sprintName,
    project,
    team,
    sprintBugs,
    backlogStates,
    refetchWorkItems,
    context,
    filters,
    inProgress,
    upcoming,
    developed,
    assigned,
  } = useWorkItemsPage({ adoExecutionReady, defaultProject });

  const [selectedWorkItem, setSelectedWorkItem] = useState<DashboardWorkItem | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const handleWorkItemClick = useCallback((item: DashboardWorkItem) => {
    setSelectedWorkItem(item);
    setSheetOpen(true);
  }, []);

  const handleSheetOpenChange = useCallback((open: boolean) => {
    setSheetOpen(open);
    if (!open) setSelectedWorkItem(null);
  }, []);

  return (
    <div className="flex w-full flex-col gap-8 pb-6">
      <header className="space-y-1">
        <h1 className="font-heading text-xl font-semibold tracking-tight sm:text-2xl">
          Work Items
        </h1>
        <p className="text-muted-foreground text-sm text-pretty">
          Historias del sprint con filtros por estado, nombre y asignación.
          {sprintName ? ` Sprint: ${sprintName}.` : null}
        </p>
      </header>

      {!adoExecutionReady ? (
        <CopilotErrorAlert message="Conecta Azure DevOps para ver las historias de usuario del sprint." />
      ) : null}

      {error ? <CopilotErrorAlert message={error} /> : null}

      {adoExecutionReady ? (
        <AdoFiltersSection
          context={context}
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
        title="Historias de usuario"
        description="Todas las historias que coinciden con los filtros."
      >
        <PbiList
          items={assigned}
          variant="compact"
          showHours
          loading={loading}
          emptyMessage="No hay historias de usuario que coincidan con los filtros."
          onItemClick={handleWorkItemClick}
        />
      </DashboardSection>

      <DashboardSection
        title="Historias en progreso"
        description="Historias de usuario en estado Committed."
      >
        <PbiList
          items={inProgress}
          variant="featured"
          loading={loading}
          emptyMessage="No hay historias en Committed con los filtros actuales."
          onItemClick={handleWorkItemClick}
        />
      </DashboardSection>

      <DashboardSection
        title="Próximas historias de usuario"
        description="Qué deberías hacer después, ordenadas por prioridad."
      >
        <PbiList
          items={upcoming}
          variant="compact"
          loading={loading}
          emptyMessage="No hay historias en New o Approved con los filtros actuales."
          onItemClick={handleWorkItemClick}
        />
      </DashboardSection>

      <DashboardSection
        title="Historias desarrolladas"
        description="En QA, Review PO, Stage o Done."
      >
        <PbiList
          items={developed}
          variant="compact"
          loading={loading}
          emptyMessage="No hay historias desarrolladas con los filtros actuales."
          onItemClick={handleWorkItemClick}
        />
      </DashboardSection>

      <UserStoryDetailSheet
        open={sheetOpen}
        onOpenChange={handleSheetOpenChange}
        workItem={selectedWorkItem}
        bugs={sprintBugs}
        backlogStates={backlogStates}
        statesLoading={loading}
        project={project}
        team={team}
        currentUserDisplayName={currentUserDisplayName}
        members={filters.members}
        membersLoading={filters.membersLoading}
        onSaved={refetchWorkItems}
      />
    </div>
  );
}
