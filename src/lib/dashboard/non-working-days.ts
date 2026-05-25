import { parseLocalDateKey, parseSprintCalendarDate, toLocalDateKey } from "@/lib/dashboard/sprint-days";

export type NonWorkingDaySource = {
  /** Fechas YYYY-MM-DD no laborables (festivos, vacaciones, etc.). */
  dates?: readonly string[];
};

/** Convierte env `AZDO_NON_WORKING_DATES` (servidor) a claves de fecha. */
export function parseNonWorkingDatesFromEnv(
  raw = process.env.AZDO_NON_WORKING_DATES,
): Set<string> {
  if (!raw?.trim()) return new Set();

  const dates = raw
    .split(",")
    .map((part) => part.trim())
    .filter((part) => /^\d{4}-\d{2}-\d{2}$/.test(part));

  return new Set(dates);
}

export function buildNonWorkingDateSet(sources: readonly NonWorkingDaySource[]): ReadonlySet<string> {
  const merged = new Set<string>();
  for (const source of sources) {
    for (const date of source.dates ?? []) {
      const key = date.trim();
      if (/^\d{4}-\d{2}-\d{2}$/.test(key)) merged.add(key);
    }
  }
  return merged;
}

/** Expande un rango ADO teamdaysoff a claves locales YYYY-MM-DD. */
export function expandDaysOffRangeToDateKeys(startIso: string, endIso: string): string[] {
  const start = parseSprintCalendarDate(startIso);
  const end = parseSprintCalendarDate(endIso);
  if (!start || !end) return [];

  const keys: string[] = [];
  const cursor = new Date(start);
  const rangeEnd = end < start ? start : end;

  while (cursor <= rangeEnd) {
    keys.push(toLocalDateKey(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  return keys;
}

export function isNonWorkingDateKey(
  dateKey: string,
  nonWorkingDates: ReadonlySet<string>,
): boolean {
  return nonWorkingDates.has(dateKey);
}

export function isWeekend(date: Date): boolean {
  const weekday = date.getDay();
  return weekday === 0 || weekday === 6;
}

export type WorkingDayFilterOptions = {
  nonWorkingDates?: ReadonlySet<string>;
};

export function isWorkingDay(date: Date, options: WorkingDayFilterOptions = {}): boolean {
  if (isWeekend(date)) return false;

  const nonWorking = options.nonWorkingDates;
  if (!nonWorking || nonWorking.size === 0) return true;

  return !nonWorking.has(toLocalDateKey(date));
}

export function countWorkingDaysInRange(
  start: Date,
  end: Date,
  options: WorkingDayFilterOptions = {},
): number {
  if (end < start) return 0;

  let count = 0;
  const cursor = new Date(start);

  while (cursor <= end) {
    if (isWorkingDay(cursor, options)) count += 1;
    cursor.setDate(cursor.getDate() + 1);
  }

  return count;
}

export function parseDateKeyOrNull(key: string): Date | null {
  return parseLocalDateKey(key);
}
