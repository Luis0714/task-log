import { sumHoursBreakdownForDayKeys } from "@/lib/dashboard/hours-breakdown";
import { HOURS_PER_SPRINT_WORKING_DAY } from "@/lib/dashboard/sprint-hours";
import { toLocalDateKey, type SprintWorkingDay } from "@/lib/dashboard/sprint-days";
import type { SprintBugHoursSource } from "@/lib/dashboard/bug-hours";
import type { SprintTaskHoursSource } from "@/lib/dashboard/task-hours";
import type { SprintWeekMetrics } from "@/lib/dashboard/types";

function getMondayOfWeek(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = d.getDay();
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
  return d;
}

/** Agrupa los días laborables del sprint por semana calendario (lunes–viernes). */
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
  tasks: SprintTaskHoursSource[],
  bugs: SprintBugHoursSource[],
): SprintWeekMetrics | null {
  if (days.length === 0) return null;

  const dayKeys = days.map((day) => day.value);
  const weekEndKey = dayKeys[dayKeys.length - 1] ?? "";
  const hours = weekEndKey
    ? sumHoursBreakdownForDayKeys(tasks, bugs, dayKeys, weekEndKey)
    : { taskHours: 0, bugHours: 0 };

  return {
    label,
    hours,
    hoursTarget: days.length * HOURS_PER_SPRINT_WORKING_DAY,
    workingDaysCount: days.length,
    dateRangeLabel: formatSprintWeekDateRange(days),
    dayKeys,
  };
}

export function computeSprintWeekMetrics(
  workingDays: readonly SprintWorkingDay[],
  tasks: SprintTaskHoursSource[],
  bugs: SprintBugHoursSource[],
): SprintWeekMetrics[] {
  return splitSprintIntoWeeks(workingDays)
    .map((days, index) => buildWeekMetrics(days, `Semana ${index + 1}`, tasks, bugs))
    .filter((week): week is SprintWeekMetrics => week !== null);
}

export function weekContainsDay(week: SprintWeekMetrics, dayKey: string): boolean {
  return week.dayKeys.includes(dayKey);
}
