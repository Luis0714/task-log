import { CopilotErrorAlert } from "@/components/copilot/copilot-error-alert";
import { DashboardSection } from "@/components/dashboard/layout/dashboard-section";
import { SprintHoursSection } from "@/components/dashboard/sections/sprint-hours-section";
import {
  firstSprintDataError,
  loadSprintBugs,
  loadSprintNonWorkingDates,
  loadSprintTasks,
} from "@/lib/ado/load-sprint-data";
import { catalogToSprintContext } from "@/lib/ado/sprint-data-context";
import type { AdoCatalogSnapshot, DashboardSprintBundle } from "@/lib/ado/types";
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

  const bundle: DashboardSprintBundle = {
    workItems: [],
    bugs: bugs.data,
    tasks: tasks.data,
    backlogStates: [],
    nonWorkingDates: nonWorkingDates.data,
    error: null,
  };

  const currentSprint = resolveCurrentSprint(catalog);
  const sprintWorkingDays = listSprintWorkingDays(
    currentSprint?.startDate,
    currentSprint?.finishDate,
    { nonWorkingDates: new Set(bundle.nonWorkingDates) },
  );

  const effectiveSprintDayKey =
    sprintDayKey || pickDefaultSprintDayKey(sprintWorkingDays) || "";

  const { metrics } = buildDashboardMetrics({
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
    <DashboardSection title="Tiempo y ritmo">
      <SprintHoursSection
        metrics={metrics}
        hoursDayLabel={hoursDayLabel}
        selectedDayKey={effectiveSprintDayKey}
      />
    </DashboardSection>
  );
}
