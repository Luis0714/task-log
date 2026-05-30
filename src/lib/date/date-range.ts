import { parseLocalDateKey, toLocalDateKey } from "@/lib/dashboard/sprint-days";

function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

function parseFilterDate(value: string): Date | null {
  const trimmed = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return parseLocalDateKey(trimmed);
  }

  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/** Incluye hoy y los `days - 1` días calendario anteriores (sin desfase por DST). */
export function isWithinDays(dateValue: string, days: number): boolean {
  if (days < 1) return false;

  const target = parseFilterDate(dateValue);
  if (!target) return false;

  const today = new Date();
  const todayStart = startOfDay(today);
  const earliest = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  earliest.setDate(earliest.getDate() - (days - 1));
  const earliestStart = startOfDay(earliest);
  const targetDay = startOfDay(target);

  return targetDay >= earliestStart && targetDay <= todayStart;
}

export function formatDateTime(isoDate: string): string {
  return new Date(isoDate).toLocaleString();
}

export function formatDateKey(dateKey: string): string {
  const date = parseLocalDateKey(dateKey);
  if (!date) return dateKey;
  return date.toLocaleDateString();
}

export function isSameCalendarDay(dateValue: string, isoDate: string): boolean {
  const a = parseFilterDate(dateValue);
  const b = parseFilterDate(isoDate);
  if (!a || !b) return false;
  return toLocalDateKey(a) === toLocalDateKey(b);
}
