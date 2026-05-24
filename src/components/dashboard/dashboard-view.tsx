"use client";

import { CopilotErrorAlert } from "@/components/copilot/copilot-error-alert";
import { ActivityTimeline } from "@/components/dashboard/activity/activity-timeline";
import { DailySummaryCard } from "@/components/dashboard/daily/daily-summary-card";
import { DashboardHeader } from "@/components/dashboard/layout/dashboard-header";
import { DashboardSection } from "@/components/dashboard/layout/dashboard-section";
import { SprintOverviewGrid } from "@/components/dashboard/metrics/sprint-overview-grid";
import { PbiList } from "@/components/dashboard/work-items/pbi-list";
import { useDashboardData } from "@/hooks/dashboard/use-dashboard-data";
import type { DashboardHeaderData } from "@/lib/dashboard/types";

export type DashboardViewProps = {
  header: DashboardHeaderData;
  adoExecutionReady: boolean;
  defaultProject?: string | null;
};

export function DashboardView({
  header,
  adoExecutionReady,
  defaultProject = null,
}: DashboardViewProps) {
  const {
    header: resolvedHeader,
    metrics,
    inProgress,
    upcoming,
    assigned,
    dailySummary,
    activity,
    regenerateDailySummary,
    loading,
    error,
  } = useDashboardData({
    adoExecutionReady,
    defaultProject,
    header,
  });

  return (
    <div className="flex w-full flex-col gap-8 pb-6">
      <DashboardHeader data={resolvedHeader} />

      {!adoExecutionReady ? (
        <CopilotErrorAlert message="Conecta Azure DevOps para ver tu dashboard con datos reales." />
      ) : null}

      {error ? <CopilotErrorAlert message={error} /> : null}

      <DashboardSection
        title="Sprint Overview"
        description="Tu progreso de hoy y del sprint actual."
      >
        <SprintOverviewGrid metrics={metrics} loading={loading} />
      </DashboardSection>

      <DashboardSection
        title="PBIs en progreso"
        description="Historias en estado Committed."
      >
        <PbiList
          items={inProgress}
          variant="featured"
          loading={loading}
          emptyMessage="No tienes PBIs en Committed."
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
          emptyMessage="No hay PBIs pendientes por ahora."
        />
      </DashboardSection>

      <DashboardSection
        title="PBIs asignadas al sprint"
        description="Todas tus historias del sprint actual."
      >
        <PbiList
          items={assigned}
          variant="compact"
          showHours
          loading={loading}
          emptyMessage="No tienes PBIs asignadas en este sprint."
        />
      </DashboardSection>

      <DashboardSection
        title="Resumen Daily"
        description="Texto breve para compartir en tu daily."
      >
        <DailySummaryCard
          key={dailySummary}
          summary={dailySummary}
          loading={loading}
          onRegenerate={regenerateDailySummary}
        />
      </DashboardSection>

      <DashboardSection title="Actividad reciente" description="Registros y cambios recientes.">
        <ActivityTimeline
          items={activity}
          loading={loading}
          emptyMessage="Registra tiempo para ver tu actividad aquí."
        />
      </DashboardSection>
    </div>
  );
}
