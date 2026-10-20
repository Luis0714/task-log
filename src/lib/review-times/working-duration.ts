import { toAdoDateTimeValue } from "@/lib/date/ado-datetime";

export const WORKDAY_START_MINUTES = 8 * 60;
export const WORKDAY_END_MINUTES = 17 * 60;
export const WORKDAY_MINUTES = WORKDAY_END_MINUTES - WORKDAY_START_MINUTES;

const MINUTE_MS = 60_000;
const MINUTES_PER_DAY = 24 * 60;

function civilClock(iso: string, timeZone: string): { key: string; minutes: number } | null {
  const instant = new Date(iso);
  if (Number.isNaN(instant.getTime())) return null;

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(instant);

  const read = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  const hour = Number(read("hour"));
  const minute = Number(read("minute"));
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;

  return {
    key: `${read("year")}-${read("month")}-${read("day")}`,
    minutes: (hour === 24 ? 0 : hour) * 60 + minute,
  };
}

function nextDateKey(dateKey: string): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  const next = new Date(Date.UTC(year, month - 1, day + 1));
  const y = next.getUTCFullYear();
  const m = String(next.getUTCMonth() + 1).padStart(2, "0");
  const d = String(next.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function isWeekend(dateKey: string, timeZone: string): boolean {
  const label = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
  }).format(new Date(toAdoDateTimeValue(dateKey, "12:00", timeZone)));
  return label === "Sat" || label === "Sun";
}

function overlapMinutes(fromMinute: number, toMinute: number): number {
  const from = Math.max(fromMinute, WORKDAY_START_MINUTES);
  const to = Math.min(toMinute, WORKDAY_END_MINUTES);
  return Math.max(0, to - from);
}

export function workingDurationMs(
  startIso: string,
  endIso: string,
  timeZone: string,
): number | null {
  const startMs = Date.parse(startIso);
  const endMs = Date.parse(endIso);
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) return null;
  if (endMs <= startMs) return 0;

  const start = civilClock(startIso, timeZone);
  const end = civilClock(endIso, timeZone);
  if (!start || !end) return null;

  let total = 0;
  let key = start.key;
  while (key <= end.key) {
    if (!isWeekend(key, timeZone)) {
      const from = key === start.key ? start.minutes : 0;
      const to = key === end.key ? end.minutes : MINUTES_PER_DAY;
      total += overlapMinutes(from, to);
    }
    if (key === end.key) break;
    key = nextDateKey(key);
  }

  return total * MINUTE_MS;
}
