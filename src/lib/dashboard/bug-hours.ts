import type { AdoWorkItemOptionDto } from "@/lib/schemas/ado-catalog";
import {
  BUG_STATUS_MAPPING,
  stateMatchesCompletedState,
} from "@/lib/dashboard/sprint-status-mapping";

export type SprintBugHoursSource = Pick<
  AdoWorkItemOptionDto,
  "state" | "loggedHours" | "workingDate"
>;

function roundHours(value: number): number {
  return Math.round(value * 10) / 10;
}

/** Bug atendido: estado completado del mapeo y Completed Work registrado. */
function isLoggedAttendedBug(bug: SprintBugHoursSource): boolean {
  return (
    stateMatchesCompletedState(bug.state, BUG_STATUS_MAPPING) &&
    typeof bug.loggedHours === "number"
  );
}

/** Horas de bugs atendidos con fecha de trabajo en el día indicado. */
export function sumAttendedBugHoursForDay(
  bugs: SprintBugHoursSource[],
  dayKey: string,
): number {
  const total = bugs.reduce((sum, bug) => {
    if (!isLoggedAttendedBug(bug) || bug.workingDate !== dayKey) return sum;
    return sum + (bug.loggedHours ?? 0);
  }, 0);
  return roundHours(total);
}

/** Horas acumuladas de bugs atendidos con fecha de trabajo hasta el día (inclusive). */
export function sumAttendedBugHoursThroughDay(
  bugs: SprintBugHoursSource[],
  dayKey: string,
): number {
  const total = bugs.reduce((sum, bug) => {
    if (!isLoggedAttendedBug(bug)) return sum;
    const workDay = bug.workingDate;
    if (!workDay || workDay > dayKey) return sum;
    return sum + (bug.loggedHours ?? 0);
  }, 0);
  return roundHours(total);
}

/** Horas en un subconjunto de días laborables, hasta maxDayKey (inclusive). */
export function sumAttendedBugHoursForDayKeys(
  bugs: SprintBugHoursSource[],
  dayKeys: readonly string[],
  maxDayKey: string,
): number {
  if (dayKeys.length === 0) return 0;

  const allowedDays = new Set(dayKeys);
  const total = bugs.reduce((sum, bug) => {
    if (!isLoggedAttendedBug(bug)) return sum;
    const workDay = bug.workingDate;
    if (!workDay || !allowedDays.has(workDay) || workDay > maxDayKey) return sum;
    return sum + (bug.loggedHours ?? 0);
  }, 0);
  return roundHours(total);
}
