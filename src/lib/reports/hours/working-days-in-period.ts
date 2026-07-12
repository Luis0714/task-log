import "server-only";

import {
  loadColombianHolidaysForRange,
  type ColombianHoliday,
} from "@/lib/holidays/co";

export async function listWorkingDaysInPeriod(
  fromIso: string,
  toIso: string,
): Promise<string[]> {
  const holidays = await loadColombianHolidaysForRange(fromIso, toIso);
  return filterWorkingDays(fromIso, toIso, holidays);
}

export function filterWorkingDays(
  fromIso: string,
  toIso: string,
  holidays: readonly ColombianHoliday[],
): string[] {
  const holidayKeys = new Set(holidays.map((h) => h.date));
  const start = parseIsoDate(fromIso);
  const end = parseIsoDate(toIso);
  if (!start || !end || end < start) return [];

  const result: string[] = [];
  const cursor = new Date(start);
  while (cursor <= end) {
    if (!isUtcWeekend(cursor)) {
      const key = toIsoKey(cursor);
      if (!holidayKeys.has(key)) {
        result.push(key);
      }
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return result;
}

function isUtcWeekend(date: Date): boolean {
  const dow = date.getUTCDay();
  return dow === 0 || dow === 6;
}

function parseIsoDate(iso: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return null;
  }
  return new Date(Date.UTC(year, month - 1, day));
}

function toIsoKey(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}