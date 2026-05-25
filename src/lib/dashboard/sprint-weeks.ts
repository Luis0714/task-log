import { sumHoursBreakdownForDayKeys } from "@/lib/dashboard/hours-breakdown";
import { HOURS_PER_SPRINT_WORKING_DAY } from "@/lib/dashboard/sprint-hours";
import type { SprintWorkingDay } from "@/lib/dashboard/sprint-days";
import type { SprintBugHoursSource } from "@/lib/dashboard/bug-hours";
import type { SprintTaskHoursSource } from "@/lib/dashboard/task-hours";
import type { SprintWeekMetrics } from "@/lib/dashboard/types";

export function splitSprintIntoWeeks(
  workingDays: readonly SprintWorkingDay[],
): [SprintWorkingDay[], SprintWorkingDay[]] {
  if (workingDays.length === 0) return [[], []];

  const mid = Math.ceil(workingDays.length / 2);
  return [workingDays.slice(0, mid), workingDays.slice(mid)];
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
  const [firstWeekDays, secondWeekDays] = splitSprintIntoWeeks(workingDays);

  return [
    buildWeekMetrics(firstWeekDays, "1ª semana", tasks, bugs),
    buildWeekMetrics(secondWeekDays, "2ª semana", tasks, bugs),
  ].filter((week): week is SprintWeekMetrics => week !== null);
}

export function weekContainsDay(week: SprintWeekMetrics, dayKey: string): boolean {
  return week.dayKeys.includes(dayKey);
}
