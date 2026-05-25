import { CopilotErrorAlert } from "@/components/copilot/copilot-error-alert";
import { DashboardSection } from "@/components/dashboard/layout/dashboard-section";
import { DashboardDailySection } from "@/components/dashboard/sections/dashboard-daily-section";
import { SprintDeliverySection } from "@/components/dashboard/sections/sprint-delivery-section";
import { SprintHoursSection } from "@/components/dashboard/sections/sprint-hours-section";
import { SprintWorkflowSection } from "@/components/dashboard/sections/sprint-workflow-section";
import { loadSprintBundle } from "@/lib/ado/load-sprint-bundle";
import type { AdoCatalogSnapshot } from "@/lib/ado/types";
import {
  buildDashboardMetrics,
  resolveCurrentSprint,
} from "@/lib/dashboard/build-dashboard-metrics";
import {
  formatSprintDayShortLabel,
  isSameLocalDay,
  listSprintWorkingDays,
  pickDefaultSprintDayKey,
} from "@/lib/dashboard/sprint-days";
import { WORK_ITEM_ASSIGNEE_ME } from "@/lib/schemas/work-item-filters";

export type DashboardBodyServerProps = {
  catalog: AdoCatalogSnapshot;
  sprintDayKey: string;
};

export async function DashboardBodyServer({
  catalog,
  sprintDayKey,
}: DashboardBodyServerProps) {
  const bundle = await loadSprintBundle({
    project: catalog.project,
    team: catalog.team,
    sprintPath: catalog.sprintPath,
    assignee: WORK_ITEM_ASSIGNEE_ME,
    includeDaysOff: true,
  });

  if (bundle.error) {
    return <CopilotErrorAlert message={bundle.error} />;
  }

  const currentSprint = resolveCurrentSprint(catalog);
  const sprintWorkingDays = listSprintWorkingDays(
    currentSprint?.startDate,
    currentSprint?.finishDate,
    { nonWorkingDates: new Set(bundle.nonWorkingDates) },
  );

  const effectiveSprintDayKey =
    sprintDayKey || pickDefaultSprintDayKey(sprintWorkingDays) || "";

  const { metrics, inProgress } = buildDashboardMetrics({
    bundle,
    catalog,
    selectedSprintDayKey: effectiveSprintDayKey,
  });

  const selectedSprintDay =
    sprintWorkingDays.find((day) => day.value === effectiveSprintDayKey) ?? null;

  const hoursDayLabel = (() => {
    if (!selectedSprintDay) return "Horas del día";
    if (isSameLocalDay(selectedSprintDay.date, new Date())) return "Horas hoy";
    return `Horas ${formatSprintDayShortLabel(selectedSprintDay)}`;
  })();

  return (
    <>
      <DashboardSection title="Entrega del sprint">
        <SprintDeliverySection metrics={metrics} loading={false} />
      </DashboardSection>

      <DashboardSection title="Tiempo y ritmo">
        <SprintHoursSection
          metrics={metrics}
          hoursDayLabel={hoursDayLabel}
          selectedDayKey={effectiveSprintDayKey}
          loading={false}
        />
      </DashboardSection>

      <DashboardSection title="Trabajo por estado">
        <SprintWorkflowSection metrics={metrics} loading={false} />
      </DashboardSection>

      <DashboardSection
        title="Resumen Daily"
        description="Texto breve para compartir en tu daily."
      >
        <DashboardDailySection
          inProgress={inProgress}
          sprintName={currentSprint?.name ?? "Sprint actual"}
        />
      </DashboardSection>
    </>
  );
}
