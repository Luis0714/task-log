import { sumAttendedBugHoursForDay, sumAttendedBugHoursForDayKeys, sumAttendedBugHoursThroughDay } from "@/lib/dashboard/bug-hours";
import type { SprintBugHoursSource } from "@/lib/dashboard/bug-hours";
import {
  sumDoneTaskHoursForDay,
  sumDoneTaskHoursForDayKeys,
  sumDoneTaskHoursThroughDay,
} from "@/lib/dashboard/task-hours";
import type { SprintTaskHoursSource } from "@/lib/dashboard/task-hours";
import type { SprintStatusMapping } from "@/lib/dashboard/sprint-status-mapping";

export type HoursBreakdown = {
  taskHours: number;
  bugHours: number;
};

export const EMPTY_HOURS_BREAKDOWN: HoursBreakdown = {
  taskHours: 0,
  bugHours: 0,
};

function roundHours(value: number): number {
  return Math.round(value * 10) / 10;
}

export function totalHoursBreakdown(breakdown: HoursBreakdown): number {
  return roundHours(breakdown.taskHours + breakdown.bugHours);
}

export function sumHoursBreakdownForDay(
  tasks: SprintTaskHoursSource[],
  bugs: SprintBugHoursSource[],
  dayKey: string,
  bugMapping: SprintStatusMapping,
): HoursBreakdown {
  return {
    taskHours: sumDoneTaskHoursForDay(tasks, dayKey),
    bugHours: sumAttendedBugHoursForDay(bugs, dayKey, bugMapping),
  };
}

export function sumHoursBreakdownThroughDay(
  tasks: SprintTaskHoursSource[],
  bugs: SprintBugHoursSource[],
  dayKey: string,
  bugMapping: SprintStatusMapping,
): HoursBreakdown {
  return {
    taskHours: sumDoneTaskHoursThroughDay(tasks, dayKey),
    bugHours: sumAttendedBugHoursThroughDay(bugs, dayKey, bugMapping),
  };
}

export function sumHoursBreakdownForDayKeys(
  tasks: SprintTaskHoursSource[],
  bugs: SprintBugHoursSource[],
  dayKeys: readonly string[],
  maxDayKey: string,
  bugMapping: SprintStatusMapping,
): HoursBreakdown {
  return {
    taskHours: sumDoneTaskHoursForDayKeys(tasks, dayKeys, maxDayKey),
    bugHours: sumAttendedBugHoursForDayKeys(bugs, dayKeys, maxDayKey, bugMapping),
  };
}