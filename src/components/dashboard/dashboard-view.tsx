"use client";

import { CopilotErrorAlert } from "@/components/copilot/copilot-error-alert";
import { DailySummaryCard } from "@/components/dashboard/daily/daily-summary-card";
import { AdoContextSelectFields } from "@/components/time-log/ado-context-select-fields";
import { DashboardHeader } from "@/components/dashboard/layout/dashboard-header";
import { DashboardSection } from "@/components/dashboard/layout/dashboard-section";
import { SprintOverviewGrid } from "@/components/dashboard/metrics/sprint-overview-grid";
import { SprintStatusOverviewGrid } from "@/components/dashboard/metrics/sprint-status-overview";
import { SprintDaySelect } from "@/components/dashboard/sprint-day-select";
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

      <DashboardSection
        title="Sprint Status Overview"
        description="Historias de usuario y bugs asignados en el sprint actual."
      >
        <SprintStatusOverviewGrid
          overview={metrics.sprintStatusOverview}
          loading={loading}
        />
      </DashboardSection>

      <DashboardSection title="Sprint Overview">
        <div className="flex flex-col gap-3">
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
    </div>
  );
}
