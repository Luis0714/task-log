import type { AdoCatalogSnapshot } from "@/lib/ado/types";
import type { DashboardHoursMetrics } from "@/lib/dashboard/types";
import { computeSprintHoursSeries } from "@/lib/dashboard/sprint-hours-series";
import { computeSprintWeekMetrics } from "@/lib/dashboard/sprint-weeks";
import {
  sumHoursBreakdownForDay,
  sumHoursBreakdownForDayKeys,
} from "@/lib/dashboard/hours-breakdown";
import { resolveCurrentSprint } from "@/lib/ado/resolve-current-sprint";
import {
  formatSprintDayShortLabel,
  isSameLocalDay,
  listSprintWorkingDays,
  resolveEffectiveSprintDayKey,
} from "@/lib/dashboard/sprint-days";
import { computeDashboardMetrics } from "@/lib/dashboard/work-item-selectors";
import type { AssignmentSegment } from "@/lib/expected-hours";
import { computeExpectedHours } from "@/lib/expected-hours";
import {
  listWorkingDayKeysBetween,
  type WorkingDayFilterOptions,
} from "@/lib/working-days";
import type { AdoWorkItemOptionDto } from "@/lib/schemas/ado-catalog";

export type BuildDashboardHoursMetricsInput = {
  tasks: AdoWorkItemOptionDto[];
  bugs: AdoWorkItemOptionDto[];
  nonWorkingDates: string[];
  userAssignmentSegments: readonly AssignmentSegment[];
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
  userAssignmentSegments,
  catalog,
  sprintDayKey,
}: BuildDashboardHoursMetricsInput): BuildDashboardHoursMetricsResult {
  const currentSprint = resolveCurrentSprint(catalog);
  const workingDayOptions: WorkingDayFilterOptions = {
    nonWorkingDates: new Set(nonWorkingDates),
  };
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
  const sprintEndKey = sprintWorkingDays.at(-1)?.value ?? "";

  const hoursToday = sumHoursBreakdownForDay(tasks, bugs, hoursDayKey);
  const sprintDayKeys = sprintWorkingDays.map((day) => day.value);
  const sprintExpected = computeSprintExpectedHours(
    currentSprint?.startDate ?? null,
    currentSprint?.finishDate ?? null,
    workingDayOptions,
    userAssignmentSegments,
  );
  const hoursSprintCurrent =
    sprintDayKeys.length > 0
      ? sumHoursBreakdownForDayKeys(tasks, bugs, sprintDayKeys, sprintEndKey)
      : { taskHours: 0, bugHours: 0 };

  const metrics = computeDashboardMetrics(hoursToday, {
    sprintHours: { hoursSprintCurrent, hoursSprintTarget: sprintExpected },
    sprintWorkingDaysCount: sprintWorkingDays.length,
    hoursByDay: computeSprintHoursSeries(
      sprintWorkingDays,
      tasks,
      bugs,
      userAssignmentSegments,
    ),
    sprintWeeks: computeSprintWeekMetrics(
      sprintWorkingDays,
      tasks,
      bugs,
      userAssignmentSegments,
    ),
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

function computeSprintExpectedHours(
  startDate: string | null,
  finishDate: string | null,
  options: WorkingDayFilterOptions,
  segments: readonly AssignmentSegment[],
): number {
  if (!startDate?.trim() || !finishDate?.trim()) return 0;
  const dayKeys = listWorkingDayKeysBetween(startDate, finishDate, options);
  if (dayKeys.length === 0) return 0;
  return computeExpectedHours(dayKeys, segments).expectedHours;
}