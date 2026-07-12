import { sumBugHoursForDay, sumBugHoursForDayKeys, sumBugHoursThroughDay } from "@/lib/dashboard/bug-hours";
import type { SprintBugHoursSource } from "@/lib/dashboard/bug-hours";
import {
  sumDoneTaskHoursForDay,
  sumDoneTaskHoursForDayKeys,
  sumDoneTaskHoursThroughDay,
} from "@/lib/dashboard/task-hours";
import type { SprintTaskHoursSource } from "@/lib/dashboard/task-hours";
import { roundHours } from "@/lib/number/rounding";

export type HoursBreakdown = {
  taskHours: number;
  bugHours: number;
};

export const EMPTY_HOURS_BREAKDOWN: HoursBreakdown = {
  taskHours: 0,
  bugHours: 0,
};

export function totalHoursBreakdown(breakdown: HoursBreakdown): number {
  return roundHours(breakdown.taskHours + breakdown.bugHours);
}

export function sumHoursBreakdownForDay(
  tasks: SprintTaskHoursSource[],
  bugs: SprintBugHoursSource[],
  dayKey: string,
): HoursBreakdown {
  return {
    taskHours: sumDoneTaskHoursForDay(tasks, dayKey),
    bugHours: sumBugHoursForDay(bugs, dayKey),
  };
}

export function sumHoursBreakdownThroughDay(
  tasks: SprintTaskHoursSource[],
  bugs: SprintBugHoursSource[],
  dayKey: string,
): HoursBreakdown {
  return {
    taskHours: sumDoneTaskHoursThroughDay(tasks, dayKey),
    bugHours: sumBugHoursThroughDay(bugs, dayKey),
  };
}

export function sumHoursBreakdownForDayKeys(
  tasks: SprintTaskHoursSource[],
  bugs: SprintBugHoursSource[],
  dayKeys: readonly string[],
  maxDayKey: string,
): HoursBreakdown {
  return {
    taskHours: sumDoneTaskHoursForDayKeys(tasks, dayKeys, maxDayKey),
    bugHours: sumBugHoursForDayKeys(bugs, dayKeys, maxDayKey),
  };
}
