import "server-only";

import { listWorkingDayKeysBetween } from "@/lib/working-days";
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
  const nonWorkingDates = new Set(holidays.map((h) => h.date));
  return listWorkingDayKeysBetween(fromIso, toIso, { nonWorkingDates });
}