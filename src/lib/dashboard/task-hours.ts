import type { AdoWorkItemOptionDto } from "@/lib/schemas/ado-catalog";
import { isDoneTaskStateName } from "@/lib/time-log/task-state-utils";

export type SprintTaskHoursSource = Pick<
  AdoWorkItemOptionDto,
  "state" | "loggedHours" | "workingDate"
>;

function roundHours(value: number): number {
  return Math.round(value * 10) / 10;
}

/** Suma Completed Work de las tareas visibles (p. ej. tras filtros del listado). */
export function sumTaskLoggedHours(
  tasks: readonly Pick<SprintTaskHoursSource, "loggedHours">[],
): number {
  const total = tasks.reduce((sum, task) => {
    if (typeof task.loggedHours !== "number" || !Number.isFinite(task.loggedHours)) {
      return sum;
    }
    return sum + task.loggedHours;
  }, 0);
  return roundHours(total);
}

function isLoggedDoneTask(task: SprintTaskHoursSource): boolean {
  return isDoneTaskStateName(task.state) && typeof task.loggedHours === "number";
}

/** Horas de tasks Done con fecha de trabajo en el día indicado. */
export function sumDoneTaskHoursForDay(
  tasks: SprintTaskHoursSource[],
  dayKey: string,
): number {
  const total = tasks.reduce((sum, task) => {
    if (!isLoggedDoneTask(task) || task.workingDate !== dayKey) return sum;
    return sum + (task.loggedHours ?? 0);
  }, 0);
  return roundHours(total);
}

/** Horas acumuladas de tasks Done con fecha de trabajo hasta el día (inclusive). */
export function sumDoneTaskHoursThroughDay(
  tasks: SprintTaskHoursSource[],
  dayKey: string,
): number {
  const total = tasks.reduce((sum, task) => {
    if (!isLoggedDoneTask(task)) return sum;
    const workDay = task.workingDate;
    if (!workDay || workDay > dayKey) return sum;
    return sum + (task.loggedHours ?? 0);
  }, 0);
  return roundHours(total);
}

/** Horas en un subconjunto de días laborables, hasta maxDayKey (inclusive). */
export function sumDoneTaskHoursForDayKeys(
  tasks: SprintTaskHoursSource[],
  dayKeys: readonly string[],
  maxDayKey: string,
): number {
  if (dayKeys.length === 0) return 0;

  const allowedDays = new Set(dayKeys);
  const total = tasks.reduce((sum, task) => {
    if (!isLoggedDoneTask(task)) return sum;
    const workDay = task.workingDate;
    if (!workDay || !allowedDays.has(workDay) || workDay > maxDayKey) return sum;
    return sum + (task.loggedHours ?? 0);
  }, 0);
  return roundHours(total);
}
