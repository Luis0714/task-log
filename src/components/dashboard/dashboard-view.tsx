"use client";

import { CopilotErrorAlert } from "@/components/copilot/copilot-error-alert";
import { ActivityTimeline } from "@/components/dashboard/activity/activity-timeline";
import { DailySummaryCard } from "@/components/dashboard/daily/daily-summary-card";
import { AdoContextSelectFields } from "@/components/time-log/ado-context-select-fields";
import { DashboardHeader } from "@/components/dashboard/layout/dashboard-header";
import { DashboardSection } from "@/components/dashboard/layout/dashboard-section";
import { SprintOverviewGrid } from "@/components/dashboard/metrics/sprint-overview-grid";
import { SprintDaySelect } from "@/components/dashboard/sprint-day-select";
import { SprintPbiProgressCard } from "@/components/dashboard/metrics/sprint-pbi-progress-card";
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
    hoursDayLabel,
    sprintDay,
    dailySummary,
    activity,
    regenerateDailySummary,
    loading,
    error,
    context,
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

      {adoExecutionReady ? (
        <DashboardSection
          title="Contexto"
          description="Proyecto, equipo y sprint para filtrar el dashboard."
        >
          <AdoContextSelectFields {...context} />
        </DashboardSection>
      ) : null}

      <DashboardSection
        title="Sprint Overview"
        description={
          sprintDay.selectedDay
            ? `Progreso del ${sprintDay.selectedDay.dayIndex}º día laborable del sprint (lun–vie, sin festivos en calendario).`
            : "Tu progreso de hoy y del sprint actual según días laborables."
        }
        action={
          sprintDay.workingDays.length > 0 ? (
            <SprintDaySelect
              value={sprintDay.value}
              workingDays={sprintDay.workingDays}
              disabled={loading}
              onValueChange={sprintDay.onValueChange}
            />
          ) : null
        }
      >
        <div className="flex flex-col gap-3">
          <SprintPbiProgressCard progress={metrics.pbiProgress} loading={loading} />
          <SprintOverviewGrid
            metrics={metrics}
            hoursDayLabel={hoursDayLabel}
            loading={loading}
          />
        </div>
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

      <DashboardSection
        title="Actividad reciente"
        description={
          sprintDay.selectedDay
            ? `Registros del ${sprintDay.selectedDay.dayIndex}º día laborable del sprint.`
            : "Registros y cambios recientes."
        }
      >
        <ActivityTimeline
          items={activity}
          loading={loading}
          emptyMessage={
            sprintDay.selectedDay
              ? "No hay registros de tiempo para este día."
              : "Registra tiempo para ver tu actividad aquí."
          }
        />
      </DashboardSection>
    </div>
  );
}
