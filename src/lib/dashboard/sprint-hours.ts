import { DEFAULT_SPRINT_HOURS_TARGET } from "@/lib/dashboard/constants";
import { parseLocalDateKey, parseSprintCalendarDate } from "@/lib/dashboard/sprint-days";

/** Horas de capacidad por día laborable del sprint. */
export const HOURS_PER_SPRINT_WORKING_DAY = 8;

function countWorkingDays(start: Date, end: Date): number {
  let count = 0;
  const cursor = new Date(start);

  while (cursor <= end) {
    const day = cursor.getDay();
    if (day !== 0 && day !== 6) count += 1;
    cursor.setDate(cursor.getDate() + 1);
  }

  return count;
}

/** Capacidad del sprint: días laborables (lun–vie) × 8 h. */
export function computeSprintCapacityHours(
  startDate?: string | null,
  finishDate?: string | null,
): number {
  if (!startDate?.trim() || !finishDate?.trim()) {
    return DEFAULT_SPRINT_HOURS_TARGET;
  }

  const start = parseSprintCalendarDate(startDate);
  const end = parseSprintCalendarDate(finishDate);
  if (!start || !end || end < start) {
    return DEFAULT_SPRINT_HOURS_TARGET;
  }

  const workingDays = countWorkingDays(start, end);
  if (workingDays <= 0) return DEFAULT_SPRINT_HOURS_TARGET;

  return workingDays * HOURS_PER_SPRINT_WORKING_DAY;
}

/** Capacidad acumulada hasta un día del sprint (inclusive), en días laborables × 8 h. */
export function computeSprintCapacityHoursThroughDay(
  startDate: string | null | undefined,
  selectedDayKey: string,
  finishDate?: string | null,
): number {
  if (!startDate?.trim() || !selectedDayKey.trim()) {
    return DEFAULT_SPRINT_HOURS_TARGET;
  }

  const start = parseSprintCalendarDate(startDate);
  const selected = parseLocalDateKey(selectedDayKey);
  if (!start || !selected) {
    return DEFAULT_SPRINT_HOURS_TARGET;
  }

  let end = selected;
  if (finishDate?.trim()) {
    const sprintEnd = parseSprintCalendarDate(finishDate);
    if (sprintEnd && sprintEnd < end) end = sprintEnd;
  }

  if (end < start) return DEFAULT_SPRINT_HOURS_TARGET;

  const workingDays = countWorkingDays(start, end);
  if (workingDays <= 0) return DEFAULT_SPRINT_HOURS_TARGET;

  return workingDays * HOURS_PER_SPRINT_WORKING_DAY;
}
