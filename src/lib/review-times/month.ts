import { toAdoDateTimeValue } from "@/lib/date/ado-datetime";

const MONTH_KEY = /^(\d{4})-(\d{2})$/;

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
  return { year: monthKey.slice(0, 4), month: monthKey.slice(5, 7) };
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
