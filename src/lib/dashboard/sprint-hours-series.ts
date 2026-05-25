import type { SprintBugHoursSource } from "@/lib/dashboard/bug-hours";
import {
  sumHoursBreakdownForDay,
  sumHoursBreakdownThroughDay,
  totalHoursBreakdown,
} from "@/lib/dashboard/hours-breakdown";
import { HOURS_PER_SPRINT_WORKING_DAY } from "@/lib/dashboard/sprint-hours";
import type { SprintWorkingDay } from "@/lib/dashboard/sprint-days";
import type { SprintTaskHoursSource } from "@/lib/dashboard/task-hours";

export type SprintDayHoursPoint = {
  dayKey: string;
  label: string;
  taskHours: number;
  bugHours: number;
  totalHours: number;
  cumulativeHours: number;
  idealCumulativeHours: number;
};

function formatDayChartLabel(date: Date): string {
  return new Intl.DateTimeFormat("es", { weekday: "short", day: "numeric" }).format(date);
}

export function computeSprintHoursSeries(
  workingDays: readonly SprintWorkingDay[],
  tasks: SprintTaskHoursSource[],
  bugs: SprintBugHoursSource[],
  maxDayKey: string,
): SprintDayHoursPoint[] {
  if (!maxDayKey.trim()) return [];

  const visibleDays = workingDays.filter((day) => day.value <= maxDayKey);
  if (visibleDays.length === 0) return [];

  return visibleDays.map((day, index) => {
    const breakdown = sumHoursBreakdownForDay(tasks, bugs, day.value);
    const cumulative = totalHoursBreakdown(
      sumHoursBreakdownThroughDay(tasks, bugs, day.value),
    );

    return {
      dayKey: day.value,
      label: formatDayChartLabel(day.date),
      taskHours: breakdown.taskHours,
      bugHours: breakdown.bugHours,
      totalHours: totalHoursBreakdown(breakdown),
      cumulativeHours: cumulative,
      idealCumulativeHours: (index + 1) * HOURS_PER_SPRINT_WORKING_DAY,
    };
  });
}
