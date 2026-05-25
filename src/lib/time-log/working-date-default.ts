import type { WorkingDayFilterOptions } from "@/lib/dashboard/sprint-days";
import {
  listSprintWorkingDays,
  pickDefaultSprintDayKey,
  toLocalDateKey,
} from "@/lib/dashboard/sprint-days";

/** Día laborable actual del sprint, o el último pasado; si no hay sprint, hoy. */
export function resolveDefaultWorkingDate(
  sprintStartDate?: string | null,
  sprintFinishDate?: string | null,
  options: WorkingDayFilterOptions = {},
): string {
  const workingDays = listSprintWorkingDays(sprintStartDate, sprintFinishDate, options);
  const defaultDay = pickDefaultSprintDayKey(workingDays);
  if (defaultDay) return defaultDay;

  const today = new Date();
  return toLocalDateKey(new Date(today.getFullYear(), today.getMonth(), today.getDate()));
}
