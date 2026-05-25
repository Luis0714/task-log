"use client";

import { CopilotErrorAlert } from "@/components/copilot/copilot-error-alert";
import { DailySummaryCard } from "@/components/dashboard/daily/daily-summary-card";
import { AdoFiltersSection } from "@/components/filters/ado-filters-section";
import { DashboardHeader } from "@/components/dashboard/layout/dashboard-header";
import { DashboardSection } from "@/components/dashboard/layout/dashboard-section";
import { SprintDaySelect } from "@/components/dashboard/sprint-day-select";
import { SprintDeliverySection } from "@/components/dashboard/sections/sprint-delivery-section";
import { SprintHoursSection } from "@/components/dashboard/sections/sprint-hours-section";
import { SprintWorkflowSection } from "@/components/dashboard/sections/sprint-workflow-section";
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
    sectionLoading,
    error,
    context,
  } = useDashboardData({
    adoExecutionReady,
    defaultProject,
    header,
  });

  return (
    <div className="flex w-full flex-col gap-6 pb-6">
      <DashboardHeader data={resolvedHeader} />

      {!adoExecutionReady ? (
        <CopilotErrorAlert message="Conecta Azure DevOps para ver tu dashboard con datos reales." />
      ) : null}

      {error ? <CopilotErrorAlert message={error} /> : null}

      {adoExecutionReady ? (
        <AdoFiltersSection
          className="max-w-3xl"
          context={{
            ...context,
            sprintDayFilter:
              sprintDay.workingDays.length > 0 ? (
                <SprintDaySelect
                  showLabel
                  value={sprintDay.value}
                  workingDays={sprintDay.workingDays}
                  disabled={sectionLoading.context}
                  className="w-full"
                  onValueChange={sprintDay.onValueChange}
                />
              ) : null,
          }}
          defaultOpen={false}
          collapsibleTitle="Contexto"
        />
      ) : null}

      <DashboardSection title="Entrega del sprint">
        <SprintDeliverySection metrics={metrics} loading={sectionLoading.delivery} />
      </DashboardSection>

      <DashboardSection title="Tiempo y ritmo">
        <SprintHoursSection
          metrics={metrics}
          hoursDayLabel={hoursDayLabel}
          selectedDayKey={sprintDay.value}
          loading={sectionLoading.hours}
        />
      </DashboardSection>

      <DashboardSection title="Trabajo por estado">
        <SprintWorkflowSection metrics={metrics} loading={sectionLoading.workflow} />
      </DashboardSection>

      <DashboardSection
        title="Resumen Daily"
        description="Texto breve para compartir en tu daily."
      >
        <DailySummaryCard
          key={dailySummary}
          summary={dailySummary}
          loading={sectionLoading.daily}
          onRegenerate={regenerateDailySummary}
        />
      </DashboardSection>
    </div>
  );
}
