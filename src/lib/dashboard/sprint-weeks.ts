import type { AssignmentSegment } from "@/lib/expected-hours";
import { computeExpectedHours } from "@/lib/expected-hours";
import { computeHoursBreakdown, type WorkedHoursItem } from "@/lib/hours/aggregate-hours";
import { toLocalDateKey, type SprintWorkingDay } from "@/lib/dashboard/sprint-days";
import type { SprintWeekMetrics } from "@/lib/dashboard/types";

function getMondayOfWeek(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = d.getDay();
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
  return d;
}

export function splitSprintIntoWeeks(
  workingDays: readonly SprintWorkingDay[],
): SprintWorkingDay[][] {
  if (workingDays.length === 0) return [];

  const weekMap = new Map<string, SprintWorkingDay[]>();
  for (const day of workingDays) {
    const key = toLocalDateKey(getMondayOfWeek(day.date));
    if (!weekMap.has(key)) weekMap.set(key, []);
    weekMap.get(key)!.push(day);
  }

  return [...weekMap.values()];
}

export function formatSprintWeekDateRange(days: readonly SprintWorkingDay[]): string {
  if (days.length === 0) return "";

  const formatter = new Intl.DateTimeFormat("es", {
    day: "numeric",
    month: "short",
  });

  const first = formatter.format(days[0].date);
  if (days.length === 1) return first;

  const last = formatter.format(days[days.length - 1].date);
  return `${first} – ${last}`;
}

function buildWeekMetrics(
  days: readonly SprintWorkingDay[],
  label: string,
  tasks: readonly WorkedHoursItem[],
  bugs: readonly WorkedHoursItem[],
  segments: readonly AssignmentSegment[],
): SprintWeekMetrics | null {
  if (days.length === 0) return null;

  const dayKeys = days.map((day) => day.value);
  const hours = computeHoursBreakdown({ tasks, bugs, workingDayKeys: new Set(dayKeys) });

  const { expectedHours } = computeExpectedHours(dayKeys, segments);

  return {
    label,
    hours,
    hoursTarget: expectedHours,
    workingDaysCount: days.length,
    dateRangeLabel: formatSprintWeekDateRange(days),
    dayKeys,
  };
}

export function computeSprintWeekMetrics(
  workingDays: readonly SprintWorkingDay[],
  tasks: readonly WorkedHoursItem[],
  bugs: readonly WorkedHoursItem[],
  segments: readonly AssignmentSegment[] = [],
): SprintWeekMetrics[] {
  return splitSprintIntoWeeks(workingDays)
    .map((days, index) =>
      buildWeekMetrics(days, `Semana ${index + 1}`, tasks, bugs, segments),
    )
    .filter((week): week is SprintWeekMetrics => week !== null);
}

export function weekContainsDay(week: SprintWeekMetrics, dayKey: string): boolean {
  return week.dayKeys.includes(dayKey);
}