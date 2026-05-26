import type { AdoCatalogSnapshot } from "@/lib/ado/types";
import type { DashboardHoursMetrics } from "@/lib/dashboard/types";
import { computeSprintCapacityHours } from "@/lib/dashboard/sprint-hours";
import { computeSprintHoursSeries } from "@/lib/dashboard/sprint-hours-series";
import { computeSprintWeekMetrics } from "@/lib/dashboard/sprint-weeks";
import {
  sumHoursBreakdownForDay,
  sumHoursBreakdownThroughDay,
} from "@/lib/dashboard/hours-breakdown";
import { resolveCurrentSprint } from "@/lib/dashboard/resolve-current-sprint";
import {
  formatSprintDayShortLabel,
  isSameLocalDay,
  listSprintWorkingDays,
  resolveEffectiveSprintDayKey,
} from "@/lib/dashboard/sprint-days";
import { computeDashboardMetrics } from "@/lib/dashboard/work-item-selectors";
import type { AdoWorkItemOptionDto } from "@/lib/schemas/ado-catalog";

export type BuildDashboardHoursMetricsInput = {
  tasks: AdoWorkItemOptionDto[];
  bugs: AdoWorkItemOptionDto[];
  nonWorkingDates: string[];
  catalog: AdoCatalogSnapshot;
  sprintDayKey: string;
};

export type BuildDashboardHoursMetricsResult = {
  metrics: DashboardHoursMetrics;
  effectiveSprintDayKey: string;
  hoursDayLabel: string;
};

export function buildDashboardHoursMetrics({
  tasks,
  bugs,
  nonWorkingDates,
  catalog,
  sprintDayKey,
}: BuildDashboardHoursMetricsInput): BuildDashboardHoursMetricsResult {
  const currentSprint = resolveCurrentSprint(catalog);
  const workingDayOptions = { nonWorkingDates: new Set(nonWorkingDates) };
  const sprintWorkingDays = listSprintWorkingDays(
    currentSprint?.startDate,
    currentSprint?.finishDate,
    workingDayOptions,
  );

  const effectiveSprintDayKey = resolveEffectiveSprintDayKey(
    sprintDayKey,
    sprintWorkingDays,
  );
  const hoursDayKey = effectiveSprintDayKey;
  const sprintEndKey = sprintWorkingDays[sprintWorkingDays.length - 1]?.value ?? "";

  const hoursToday = sumHoursBreakdownForDay(tasks, bugs, hoursDayKey);
  const hoursSprintTarget = computeSprintCapacityHours(
    currentSprint?.startDate,
    currentSprint?.finishDate,
    workingDayOptions,
  );
  const hoursSprintCurrent =
    sprintEndKey !== ""
      ? sumHoursBreakdownThroughDay(tasks, bugs, sprintEndKey)
      : { taskHours: 0, bugHours: 0 };

  const metrics = computeDashboardMetrics(hoursToday, {
    sprintHours: { hoursSprintCurrent, hoursSprintTarget },
    sprintWorkingDaysCount: sprintWorkingDays.length,
    hoursByDay: computeSprintHoursSeries(sprintWorkingDays, tasks, bugs),
    sprintWeeks: computeSprintWeekMetrics(sprintWorkingDays, tasks, bugs),
  });

  const selectedSprintDay =
    sprintWorkingDays.find((day) => day.value === effectiveSprintDayKey) ?? null;

  const hoursDayLabel = (() => {
    if (!selectedSprintDay) return "Horas del día";
    if (isSameLocalDay(selectedSprintDay.date, new Date())) return "Horas hoy";
    return `Horas ${formatSprintDayShortLabel(selectedSprintDay)}`;
  })();

  return { metrics, effectiveSprintDayKey, hoursDayLabel };
}
