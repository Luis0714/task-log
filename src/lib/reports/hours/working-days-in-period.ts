import "server-only";

import {
  loadColombianHolidaysForRange,
  type Holiday,
} from "@/lib/holidays";
import { listWorkingDayKeysBetween } from "@/lib/working-days";

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
  holidays: readonly Holiday[],
): string[] {
  const nonWorkingDates = new Set(holidays.map((h) => h.date));
  return listWorkingDayKeysBetween(fromIso, toIso, { nonWorkingDates });
}