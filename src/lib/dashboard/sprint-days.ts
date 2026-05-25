import {
  countWorkingDaysInRange,
  isWorkingDay,
  type WorkingDayFilterOptions,
} from "@/lib/dashboard/non-working-days";

export type SprintWorkingDay = {
  /** Fecha local en formato YYYY-MM-DD. */
  value: string;
  /** Día laborable del sprint (1-based). */
  dayIndex: number;
  date: Date;
};

export type { WorkingDayFilterOptions };

export function toLocalDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseLocalDateKey(key: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key.trim());
  if (!match) return null;

  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Fecha civil YYYY-MM-DD del sprint, sin desfase por zona horaria. */
export function parseSprintCalendarDate(iso: string | null | undefined): Date | null {
  if (!iso?.trim()) return null;
  return parseLocalDateKey(iso.trim().slice(0, 10));
}

export function isSameLocalDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function listSprintWorkingDays(
  startDate?: string | null,
  finishDate?: string | null,
  options: WorkingDayFilterOptions = {},
): SprintWorkingDay[] {
  if (!startDate?.trim() || !finishDate?.trim()) return [];

  const start = parseSprintCalendarDate(startDate);
  const end = parseSprintCalendarDate(finishDate);
  if (!start || !end || end < start) return [];

  const days: SprintWorkingDay[] = [];
  const cursor = new Date(start);
  let dayIndex = 0;

  while (cursor <= end) {
    if (isWorkingDay(cursor, options)) {
      dayIndex += 1;
      days.push({
        value: toLocalDateKey(cursor),
        dayIndex,
        date: new Date(cursor),
      });
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return days;
}

export { countWorkingDaysInRange };

export function pickDefaultSprintDayKey(workingDays: SprintWorkingDay[]): string | null {
  if (workingDays.length === 0) return null;

  const today = new Date();
  const todayKey = toLocalDateKey(
    new Date(today.getFullYear(), today.getMonth(), today.getDate()),
  );

  const todayInSprint = workingDays.find((day) => day.value === todayKey);
  if (todayInSprint) return todayInSprint.value;

  let lastPast: SprintWorkingDay | null = null;
  for (const day of workingDays) {
    if (day.value <= todayKey) {
      lastPast = day;
      continue;
    }
    break;
  }

  return lastPast?.value ?? workingDays[0]?.value ?? null;
}

export function formatSprintDayOptionLabel(day: SprintWorkingDay): string {
  const dateLabel = formatSprintDayDateLabel(day);

  if (isSameLocalDay(day.date, new Date())) {
    return `Hoy · ${dateLabel}`;
  }

  return `Día ${day.dayIndex} · ${dateLabel}`;
}

export function formatSprintDayShortLabel(day: SprintWorkingDay): string {
  if (isSameLocalDay(day.date, new Date())) return "hoy";
  return `día ${day.dayIndex}`;
}

function formatSprintDayDateLabel(day: SprintWorkingDay): string {
  return new Intl.DateTimeFormat("es", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(day.date);
}

/** Etiqueta de eje para gráficas por día (solo fecha, sin índice del sprint). */
export function formatSprintDayChartLabel(day: SprintWorkingDay): string {
  return formatSprintDayDateLabel(day);
}
