import type { SprintBugHoursSource } from "@/lib/dashboard/bug-hours";
import {
  sumHoursBreakdownForDay,
  totalHoursBreakdown,
} from "@/lib/dashboard/hours-breakdown";
import { HOURS_PER_SPRINT_WORKING_DAY } from "@/lib/dashboard/sprint-hours";
import {
  formatSprintDayChartLabel,
  type SprintWorkingDay,
} from "@/lib/dashboard/sprint-days";
import type { SprintTaskHoursSource } from "@/lib/dashboard/task-hours";
import type { SprintStatusMapping } from "@/lib/dashboard/sprint-status-mapping";

export type SprintDayHoursPoint = {
  dayKey: string;
  label: string;
  taskHours: number;
  bugHours: number;
  totalHours: number;
  cumulativeHours: number;
  idealCumulativeHours: number;
};

/** Props del eje X cuando hay un punto por día laborable del sprint. */
export function sprintDayAxisProps(dayCount: number) {
  const dense = dayCount > 4;
  return {
    interval: 0 as const,
    angle: dense ? -48 : -18,
    textAnchor: dense ? ("end" as const) : ("end" as const),
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

/** Un punto por cada día laborable del sprint (incluye días con 0 h). */
export function computeSprintHoursSeries(
  workingDays: readonly SprintWorkingDay[],
  tasks: SprintTaskHoursSource[],
  bugs: SprintBugHoursSource[],
  bugMapping: SprintStatusMapping,
): SprintDayHoursPoint[] {
  if (workingDays.length === 0) return [];

  let runningTotal = 0;
  return workingDays.map((day, index) => {
    const breakdown = sumHoursBreakdownForDay(tasks, bugs, day.value, bugMapping);
    runningTotal += totalHoursBreakdown(breakdown);

    return {
      dayKey: day.value,
      label: formatSprintDayChartLabel(day),
      taskHours: breakdown.taskHours,
      bugHours: breakdown.bugHours,
      totalHours: totalHoursBreakdown(breakdown),
      cumulativeHours: Math.round(runningTotal * 10) / 10,
      idealCumulativeHours: (index + 1) * HOURS_PER_SPRINT_WORKING_DAY,
    };
  });
}
