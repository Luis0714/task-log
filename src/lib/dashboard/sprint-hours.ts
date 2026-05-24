import { DEFAULT_SPRINT_HOURS_TARGET } from "@/lib/dashboard/constants";

/** Horas de capacidad por día laborable del sprint. */
export const HOURS_PER_SPRINT_WORKING_DAY = 8;

function toLocalDateOnly(iso: string): Date | null {
  const timestamp = Date.parse(iso);
  if (!Number.isFinite(timestamp)) return null;
  const date = new Date(timestamp);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

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

  const start = toLocalDateOnly(startDate);
  const end = toLocalDateOnly(finishDate);
  if (!start || !end || end < start) {
    return DEFAULT_SPRINT_HOURS_TARGET;
  }

  const workingDays = countWorkingDays(start, end);
  if (workingDays <= 0) return DEFAULT_SPRINT_HOURS_TARGET;

  return workingDays * HOURS_PER_SPRINT_WORKING_DAY;
}
