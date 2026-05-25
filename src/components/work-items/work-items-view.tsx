"use client";

import { CopilotErrorAlert } from "@/components/copilot/copilot-error-alert";
import { DashboardSection } from "@/components/dashboard/layout/dashboard-section";
import { PbiList } from "@/components/dashboard/work-items/pbi-list";
import { AdoContextSelectFields } from "@/components/time-log/ado-context-select-fields";
import { WorkItemFiltersPanel } from "@/components/time-log/work-item-filters-panel";
import { useWorkItemsPage } from "@/hooks/work-items/use-work-items-page";

export type WorkItemsViewProps = {
  adoExecutionReady: boolean;
  defaultProject?: string | null;
};

export function WorkItemsView({
  adoExecutionReady,
  defaultProject = null,
}: WorkItemsViewProps) {
  const {
    loading,
    error,
    sprintName,
    context,
    filters,
    inProgress,
    upcoming,
    assigned,
  } = useWorkItemsPage({ adoExecutionReady, defaultProject });

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
        <CopilotErrorAlert message="Conecta Azure DevOps para ver tus PBIs del sprint." />
      ) : null}

      {error ? <CopilotErrorAlert message={error} /> : null}

      {adoExecutionReady ? (
        <DashboardSection
          title="Contexto"
          description="Proyecto, equipo y sprint para cargar las historias."
        >
          <AdoContextSelectFields {...context} />
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
        title="PBIs del sprint"
        description="Todas las historias que coinciden con los filtros."
      >
        <PbiList
          items={assigned}
          variant="compact"
          showHours
          loading={loading}
          emptyMessage="No hay PBIs que coincidan con los filtros."
        />
      </DashboardSection>

      <DashboardSection
        title="PBIs en progreso"
        description="Historias en estado Committed."
      >
        <PbiList
          items={inProgress}
          variant="featured"
          loading={loading}
          emptyMessage="No hay PBIs en Committed con los filtros actuales."
        />
      </DashboardSection>

      <DashboardSection
        title="Próximas PBIs"
        description="Qué deberías hacer después, ordenadas por prioridad."
      >
        <PbiList
          items={upcoming}
          variant="compact"
          loading={loading}
          emptyMessage="No hay PBIs pendientes con los filtros actuales."
        />
      </DashboardSection>
    </div>
  );
}
