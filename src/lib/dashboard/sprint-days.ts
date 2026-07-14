import {
  isSameLocalDay,
  isWeekendKey,
  isWorkingDayKey,
  parseLocalDateKey,
  toLocalDateKey,
  type WorkingDayFilterOptions,
} from "@/lib/working-days";

export {
  countWorkingDayKeysBetween as countWorkingDaysInRange,
  isSameLocalDay,
  parseLocalDateKey,
  toLocalDateKey,
  type WorkingDayFilterOptions,
} from "@/lib/working-days";

export type SprintWorkingDay = {
  /** Fecha local en formato YYYY-MM-DD. */
  value: string;
  /** Día laborable del sprint (1-based). */
  dayIndex: number;
  date: Date;
};

/** Fecha civil YYYY-MM-DD del sprint, sin desfase por zona horaria. */
export function parseSprintCalendarDate(iso: string | null | undefined): Date | null {
  if (!iso?.trim()) return null;
  return parseLocalDateKey(iso.trim().slice(0, 10));
}

/**
 * Recorrido único del calendario del sprint (fuente de verdad de ambos
 * listados). Excluye siempre los fines de semana; los festivos entre semana
 * solo se incluyen si `includeHolidays` (con el `dayIndex` del laborable
 * anterior: no consumen día del sprint).
 */
function listSprintDays(
  startDate: string | null | undefined,
  finishDate: string | null | undefined,
  options: WorkingDayFilterOptions,
  includeHolidays: boolean,
): SprintWorkingDay[] {
  if (!startDate?.trim() || !finishDate?.trim()) return [];

  const start = parseSprintCalendarDate(startDate);
  const end = parseSprintCalendarDate(finishDate);
  if (!start || !end || end < start) return [];

  const days: SprintWorkingDay[] = [];
  const cursor = new Date(start);
  let dayIndex = 0;

  while (cursor <= end) {
    const key = toLocalDateKey(cursor);
    if (!isWeekendKey(key)) {
      const isWorking = isWorkingDayKey(key, options);
      if (isWorking) dayIndex += 1;
      if (isWorking || includeHolidays) {
        days.push({ value: key, dayIndex, date: new Date(cursor) });
      }
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return days;
}

export function listSprintWorkingDays(
  startDate?: string | null,
  finishDate?: string | null,
  options: WorkingDayFilterOptions = {},
): SprintWorkingDay[] {
  return listSprintDays(startDate, finishDate, options, false);
}

/**
 * Calendario del sprint incluyendo festivos entre semana. Cada festivo queda
 * en la posición que le corresponde en el eje X de las gráficas. Usado por la
 * serie de horas del sprint para representar visualmente los días no
 * laborables.
 */
export function listSprintCalendarDays(
  startDate?: string | null,
  finishDate?: string | null,
  options: WorkingDayFilterOptions = {},
): SprintWorkingDay[] {
  return listSprintDays(startDate, finishDate, options, true);
}

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

export function isSprintWorkingDayKey(
  sprintDayKey: string,
  workingDays: readonly SprintWorkingDay[],
): boolean {
  const key = sprintDayKey.trim();
  if (!key) return false;
  return workingDays.some((day) => day.value === key);
}

export function resolveEffectiveSprintDayKey(
  sprintDayKey: string | undefined | null,
  workingDays: readonly SprintWorkingDay[],
): string {
  const key = sprintDayKey?.trim() ?? "";
  if (isSprintWorkingDayKey(key, workingDays)) return key;
  return pickDefaultSprintDayKey([...workingDays]) ?? "";
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

export function formatSprintDayChartLabel(day: SprintWorkingDay): string {
  return formatSprintDayDateLabel(day);
}

export type SprintDateBounds = {
  min: string | undefined;
  max: string | undefined;
};

export function getSprintDateBounds(
  workingDays: readonly SprintWorkingDay[],
): SprintDateBounds {
  if (workingDays.length === 0) return { min: undefined, max: undefined };
  return {
    min: workingDays[0]?.value,
    max: workingDays[workingDays.length - 1]?.value,
  };
}