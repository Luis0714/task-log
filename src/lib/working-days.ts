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

/**
 * Última clave `YYYY-MM-DD` laborable del rango inclusivo [fromIso, toIso].
 * Típicamente se invoca con (startDate, hoy) para obtener el último día en
 * que el usuario debió registrar horas (hoy si es laborable; viernes si hoy
 * es sábado/domingo; el hábil anterior si hoy es festivo; retrocede sobre
 * festivos consecutivos). Devuelve `null` si no hay ningún laborable en el
 * rango (p. ej. solo fines de semana, sin semana colindante).
 */
export function resolveLastWorkingDayKey(
  fromIso: string,
  toIso: string,
  options: WorkingDayFilterOptions = {},
): string | null {
  const end = parseLocalDateKey(toIso);
  const lowerBound = parseLocalDateKey(fromIso);
  if (!end || !lowerBound || end < lowerBound) return null;

  const cursor = new Date(end);
  while (cursor >= lowerBound) {
    const key = toLocalDateKey(cursor);
    if (isWorkingDayKey(key, options)) return key;
    cursor.setDate(cursor.getDate() - 1);
  }
  return null;
}

/**
 * Avanza `count` días hábiles desde `fromIso` (inclusive de `fromIso` como
 * día 0 de referencia) y devuelve la clave `YYYY-MM-DD` resultante.
 *
 * `count` es la cantidad de días hábiles a sumar: `addWorkingDayKeys(lunes, 1)`
 * devuelve el martes (si es hábil). Salta fines de semana y festivos. Un
 * `count <= 0` devuelve la misma clave `fromIso` sin avanzar. Devuelve `null`
 * si `fromIso` no es una fecha válida.
 */
export function addWorkingDayKeys(
  fromIso: string,
  count: number,
  options: WorkingDayFilterOptions = {},
): string | null {
  const start = parseLocalDateKey(fromIso);
  if (!start) return null;

  const steps = Math.trunc(count);
  if (steps <= 0) return toLocalDateKey(start);

  const cursor = new Date(start);
  let remaining = steps;
  while (remaining > 0) {
    cursor.setDate(cursor.getDate() + 1);
    if (isWorkingDayKey(toLocalDateKey(cursor), options)) remaining -= 1;
  }
  return toLocalDateKey(cursor);
}

/**
 * Primer día hábil estrictamente posterior a `fromIso`. Salta fines de semana
 * y festivos. Devuelve `null` si `fromIso` no es una fecha válida.
 */
export function nextWorkingDayKey(
  fromIso: string,
  options: WorkingDayFilterOptions = {},
): string | null {
  return addWorkingDayKeys(fromIso, 1, options);
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