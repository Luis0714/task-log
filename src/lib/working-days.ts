export const HOURS_PER_WORKING_DAY = 8;

export type WorkingDayFilterOptions = {
  nonWorkingDates?: ReadonlySet<string>;
};

export function isWeekendKey(dateKey: string): boolean {
  const date = parseLocalDateKey(dateKey);
  if (!date) return false;
  const dow = date.getDay();
  return dow === 0 || dow === 6;
}

export function isWorkingDayKey(
  dateKey: string,
  options: WorkingDayFilterOptions = {},
): boolean {
  if (isWeekendKey(dateKey)) return false;
  const nonWorking = options.nonWorkingDates;
  if (!nonWorking || nonWorking.size === 0) return true;
  return !nonWorking.has(dateKey.trim());
}

export function filterWorkingDayKeys(
  keys: readonly string[],
  options: WorkingDayFilterOptions = {},
): string[] {
  return keys.filter((key) => isWorkingDayKey(key, options));
}

export function listWorkingDayKeysBetween(
  fromIso: string,
  toIso: string,
  options: WorkingDayFilterOptions = {},
): string[] {
  const start = parseLocalDateKey(fromIso);
  const end = parseLocalDateKey(toIso);
  if (!start || !end || end < start) return [];

  const result: string[] = [];
  const cursor = new Date(start);
  while (cursor <= end) {
    const key = toLocalDateKey(cursor);
    if (isWorkingDayKey(key, options)) result.push(key);
    cursor.setDate(cursor.getDate() + 1);
  }
  return result;
}

export function countWorkingDayKeysBetween(
  fromIso: string,
  toIso: string,
  options: WorkingDayFilterOptions = {},
): number {
  return listWorkingDayKeysBetween(fromIso, toIso, options).length;
}

export function parseLocalDateKey(key: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key.trim());
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isNaN(date.getTime()) ? null : date;
}

export function toLocalDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function isSameLocalDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}