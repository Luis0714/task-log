import type { AdoWorkItemOptionDto } from "@/lib/schemas/ado-catalog";

export type SprintBugHoursSource = Pick<
  AdoWorkItemOptionDto,
  "loggedHours" | "workingDate"
>;

function roundHours(value: number): number {
  return Math.round(value * 10) / 10;
}

function hasLoggedHours(bug: SprintBugHoursSource): boolean {
  return typeof bug.loggedHours === "number";
}

/** Horas de bugs con fecha de trabajo en el día indicado (sin filtro de estado). */
export function sumBugHoursForDay(
  bugs: SprintBugHoursSource[],
  dayKey: string,
): number {
  const total = bugs.reduce((sum, bug) => {
    if (!hasLoggedHours(bug) || bug.workingDate !== dayKey) return sum;
    return sum + (bug.loggedHours ?? 0);
  }, 0);
  return roundHours(total);
}

/** Horas acumuladas de bugs con fecha de trabajo hasta el día (inclusive). */
export function sumBugHoursThroughDay(
  bugs: SprintBugHoursSource[],
  dayKey: string,
): number {
  const total = bugs.reduce((sum, bug) => {
    if (!hasLoggedHours(bug)) return sum;
    const workDay = bug.workingDate;
    if (!workDay || workDay > dayKey) return sum;
    return sum + (bug.loggedHours ?? 0);
  }, 0);
  return roundHours(total);
}

/** Horas de bugs en un subconjunto de días laborables, hasta maxDayKey (inclusive). */
export function sumBugHoursForDayKeys(
  bugs: SprintBugHoursSource[],
  dayKeys: readonly string[],
  maxDayKey: string,
): number {
  if (dayKeys.length === 0) return 0;

  const allowedDays = new Set(dayKeys);
  const total = bugs.reduce((sum, bug) => {
    if (!hasLoggedHours(bug)) return sum;
    const workDay = bug.workingDate;
    if (!workDay || !allowedDays.has(workDay) || workDay > maxDayKey) return sum;
    return sum + (bug.loggedHours ?? 0);
  }, 0);
  return roundHours(total);
}
