import { roundHours } from "@/lib/number/rounding";

/**
 * Desglose canónico de horas trabajadas: tasks (desarrollo) y bugs.
 * Los nombres de campos están persistidos en snapshots de sprint
 * (`parse-sprint-stats-payload.ts`); no renombrarlos.
 */
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

export function sumHoursBreakdowns(
  parts: Iterable<HoursBreakdown>,
): HoursBreakdown {
  let taskHours = 0;
  let bugHours = 0;
  for (const part of parts) {
    taskHours += part.taskHours;
    bugHours += part.bugHours;
  }
  return { taskHours: roundHours(taskHours), bugHours: roundHours(bugHours) };
}
