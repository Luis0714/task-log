import { toAdoDateTimeValue } from "@/lib/date/ado-datetime";

const MONTH_KEY = /^(\d{4})-(\d{2})$/;

export const MAX_REVIEW_MONTHS = 3;

export const REVIEW_MONTHS = [
  { value: "01", label: "Enero" },
  { value: "02", label: "Febrero" },
  { value: "03", label: "Marzo" },
  { value: "04", label: "Abril" },
  { value: "05", label: "Mayo" },
  { value: "06", label: "Junio" },
  { value: "07", label: "Julio" },
  { value: "08", label: "Agosto" },
  { value: "09", label: "Septiembre" },
  { value: "10", label: "Octubre" },
  { value: "11", label: "Noviembre" },
  { value: "12", label: "Diciembre" },
] as const;

export type MonthWindow = {
  minTime: string;
  maxTime: string;
  start: string;
};

export function currentMonthKey(timeZone: string, now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
  }).formatToParts(now);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  if (!year || !month) return "1970-01";
  return `${year}-${month}`;
}

export function reviewYearOptions(anchorYear: number): number[] {
  return Array.from({ length: 5 }, (_, index) => anchorYear - index);
}

export function splitMonthKey(monthKey: string): { year: string; month: string } {
  const [year = "", month = ""] = monthKey.split("-");
  return { year, month };
}

export function joinMonthKey(year: string, month: string): string {
  return `${year}-${month}`;
}

export function monthWindow(monthKey: string, timeZone: string): MonthWindow | null {
  const match = MONTH_KEY.exec(monthKey);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (month < 1 || month > 12) return null;

  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  const startKey = `${match[1]}-${match[2]}-01`;
  const endKey = `${String(nextYear)}-${String(nextMonth).padStart(2, "0")}-01`;
  return windowBetween(startKey, endKey, timeZone);
}

export function normalizeMonthKeys(
  keys: readonly string[],
  timeZone: string,
  now = new Date(),
): string[] {
  const valid = [
    ...new Set(keys.map((key) => key.trim()).filter((key) => monthWindow(key, timeZone) != null)),
  ].sort((left, right) => left.localeCompare(right));
  if (valid.length === 0) return [currentMonthKey(timeZone, now)];
  const year = valid[0]?.slice(0, 4);
  return valid.filter((key) => key.startsWith(`${year}-`)).slice(0, MAX_REVIEW_MONTHS);
}

function windowBetween(startKey: string, endKey: string, timeZone: string): MonthWindow {
  const start = toAdoDateTimeValue(startKey, "00:00", timeZone);
  const maxTime = toAdoDateTimeValue(endKey, "00:00", timeZone);
  const minTime = new Date(Date.parse(start) - 1000).toISOString();
  return { minTime, maxTime, start };
}

export function isCreatedInMonth(createdAt: string, window: MonthWindow): boolean {
  const created = Date.parse(createdAt);
  const start = Date.parse(window.start);
  const end = Date.parse(window.maxTime);
  if (!Number.isFinite(created) || !Number.isFinite(start) || !Number.isFinite(end)) {
    return false;
  }
  return created >= start && created < end;
}
