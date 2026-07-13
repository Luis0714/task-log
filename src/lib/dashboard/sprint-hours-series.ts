import type { AssignmentSegment } from "@/lib/expected-hours";
import { computeExpectedHours } from "@/lib/expected-hours";
import type { SprintBugHoursSource } from "@/lib/dashboard/bug-hours";
import {
  sumHoursBreakdownForDay,
  totalHoursBreakdown,
} from "@/lib/dashboard/hours-breakdown";
import {
  formatSprintDayChartLabel,
  type SprintWorkingDay,
} from "@/lib/dashboard/sprint-days";
import type { SprintTaskHoursSource } from "@/lib/dashboard/task-hours";
import { HOURS_PER_WORKING_DAY } from "@/lib/working-days";

export type SprintDayHoursPoint = {
  dayKey: string;
  label: string;
  taskHours: number;
  bugHours: number;
  totalHours: number;
  cumulativeHours: number;
  /** Línea ideal acumulada respetando el % de asignación del usuario. */
  idealCumulativeHours: number;
};

export function sprintDayAxisProps(dayCount: number) {
  const dense = dayCount > 4;
  return {
    interval: 0 as const,
    angle: dense ? -48 : -18,
    textAnchor: "end" as const,
    height: dense ? 72 : 56,
    tick: { fontSize: dense ? 8 : 9 },
  };
}

export function sprintDayChartMargin(dayCount: number) {
  return {
    top: 12,
    right: 8,
    left: -18,
    bottom: dayCount > 4 ? 20 : 12,
  } as const;
}

export function computeSprintHoursSeries(
  workingDays: readonly SprintWorkingDay[],
  tasks: SprintTaskHoursSource[],
  bugs: SprintBugHoursSource[],
  segments: readonly AssignmentSegment[] = [],
): SprintDayHoursPoint[] {
  if (workingDays.length === 0) return [];

  const dayKeys = workingDays.map((day) => day.value);
  const { weightedPct } = computeExpectedHours(dayKeys, segments);
  const idealPerDay = (weightedPct / 100) * HOURS_PER_WORKING_DAY;

  let runningTotal = 0;
  return workingDays.map((day, index) => {
    const breakdown = sumHoursBreakdownForDay(tasks, bugs, day.value);
    runningTotal += totalHoursBreakdown(breakdown);

    return {
      dayKey: day.value,
      label: formatSprintDayChartLabel(day),
      taskHours: breakdown.taskHours,
      bugHours: breakdown.bugHours,
      totalHours: totalHoursBreakdown(breakdown),
      cumulativeHours: Math.round(runningTotal * 10) / 10,
      idealCumulativeHours: Math.round((index + 1) * idealPerDay * 10) / 10,
    };
  });
}