import { DEFAULT_SPRINT_HOURS_TARGET } from "@/lib/dashboard/constants";
import { parseSprintCalendarDate } from "@/lib/dashboard/sprint-days";
import {
  countWorkingDayKeysBetween,
  HOURS_PER_WORKING_DAY,
  parseLocalDateKey,
  toLocalDateKey,
  type WorkingDayFilterOptions,
} from "@/lib/working-days";

export function computeSprintCapacityHours(
  startDate?: string | null,
  finishDate?: string | null,
  options: WorkingDayFilterOptions = {},
): number {
  if (!startDate?.trim() || !finishDate?.trim()) {
    return DEFAULT_SPRINT_HOURS_TARGET;
  }

  const start = parseSprintCalendarDate(startDate);
  const end = parseSprintCalendarDate(finishDate);
  if (!start || !end || end < start) {
    return DEFAULT_SPRINT_HOURS_TARGET;
  }

  const workingDays = countWorkingDayKeysBetween(startDate.trim(), finishDate.trim(), options);
  if (workingDays <= 0) return DEFAULT_SPRINT_HOURS_TARGET;

  return workingDays * HOURS_PER_WORKING_DAY;
}

export function computeSprintCapacityHoursThroughDay(
  startDate: string | null | undefined,
  selectedDayKey: string,
  finishDate?: string | null,
  options: WorkingDayFilterOptions = {},
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

  const workingDays = countWorkingDayKeysBetween(startDate.trim(), toLocalDateKey(end), options);
  if (workingDays <= 0) return DEFAULT_SPRINT_HOURS_TARGET;

  return workingDays * HOURS_PER_WORKING_DAY;
}