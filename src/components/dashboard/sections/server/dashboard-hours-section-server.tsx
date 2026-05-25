import { CopilotErrorAlert } from "@/components/copilot/copilot-error-alert";
import { DashboardSection } from "@/components/dashboard/layout/dashboard-section";
import { SprintHoursSection } from "@/components/dashboard/sections/sprint-hours-section";
import {
  emptyDashboardBundle,
  buildDashboardSectionMetrics,
} from "@/lib/dashboard/build-dashboard-section-metrics";
import {
  firstSprintDataError,
  loadSprintBugs,
  loadSprintNonWorkingDates,
  loadSprintTasks,
} from "@/lib/ado/load-sprint-data";
import { catalogToSprintContext } from "@/lib/ado/sprint-data-context";
import type { AdoCatalogSnapshot } from "@/lib/ado/types";

export type DashboardHoursSectionServerProps = {
  catalog: AdoCatalogSnapshot;
  sprintDayKey: string;
};

export async function DashboardHoursSectionServer({
  catalog,
  sprintDayKey,
}: DashboardHoursSectionServerProps) {
  const ctx = catalogToSprintContext(catalog);
  if (!ctx) return null;

  const [tasks, bugs, nonWorkingDates] = await Promise.all([
    loadSprintTasks(ctx),
    loadSprintBugs(ctx),
    loadSprintNonWorkingDates(ctx),
  ]);

  const error = firstSprintDataError(tasks, bugs, nonWorkingDates);
  if (error) return <CopilotErrorAlert message={error} />;

  const { metrics, effectiveSprintDayKey, hoursDayLabel } = buildDashboardSectionMetrics({
    bundle: emptyDashboardBundle({
      bugs: bugs.data,
      tasks: tasks.data,
      nonWorkingDates: nonWorkingDates.data,
    }),
    catalog,
    sprintDayKey,
  });

  return (
    <DashboardSection title="Tiempo y ritmo">
      <SprintHoursSection
        metrics={metrics}
        hoursDayLabel={hoursDayLabel}
        selectedDayKey={effectiveSprintDayKey}
      />
    </DashboardSection>
  );
}
