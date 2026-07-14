import {
  EMPTY_HOURS_BREAKDOWN,
  type HoursBreakdown,
} from "@/lib/hours/hours-breakdown";
import { roundHours } from "@/lib/number/rounding";

/**
 * Motor ÚNICO de suma de horas trabajadas. Toda métrica de horas
 * (dashboard, reporte por periodo, reporte por sprint, snapshots, excel)
 * sale de aquí; los consumidores solo varían parámetros.
 *
 * Reglas de negocio unificadas:
 * 1. Un item cuenta si tiene Completed Work > 0, en cualquier estado
 *    salvo Removed (la WIQL ya lo excluye; aquí es defensa).
 * 2. Solo cuentan horas cuya fecha de trabajo cae en día hábil
 *    (`workingDayKeys`, calendario único resuelto en server).
 * 3. Tasks y bugs se rigen por las mismas reglas.
 */

/** Contrato mínimo (ISP); lo cumplen AdoWorkItemOption y AdoWorkItemOptionDto. */
export type WorkedHoursItem = {
  /** Completed Work reportado. */
  loggedHours?: number;
  /** Fecha de trabajo YYYY-MM-DD (workingDateField). */
  workingDate?: string;
  state?: string;
  assignedTo?: string;
};

export type WorkedHoursInput = {
  tasks: readonly WorkedHoursItem[];
  bugs: readonly WorkedHoursItem[];
  /**
   * Días hábiles permitidos. La variante rango/semana/día se expresa con
   * este subconjunto: día = Set de 1 clave; semana = claves de la semana;
   * rango completo = todos los días hábiles del rango.
   */
  workingDayKeys: ReadonlySet<string>;
};

const REMOVED_STATE = "removed";

export function countsAsWorkedHours(
  item: WorkedHoursItem,
  workingDayKeys: ReadonlySet<string>,
): boolean {
  if (typeof item.loggedHours !== "number" || !Number.isFinite(item.loggedHours)) {
    return false;
  }
  if (item.loggedHours <= 0) return false;
  if (item.state?.trim().toLowerCase() === REMOVED_STATE) return false;
  return item.workingDate !== undefined && workingDayKeys.has(item.workingDate);
}

function sumWorkedHours(
  items: readonly WorkedHoursItem[],
  workingDayKeys: ReadonlySet<string>,
): number {
  let total = 0;
  for (const item of items) {
    if (countsAsWorkedHours(item, workingDayKeys)) total += item.loggedHours ?? 0;
  }
  return roundHours(total);
}

/** Desglose del rango (o del subconjunto de días que exprese `workingDayKeys`). */
export function computeHoursBreakdown(input: WorkedHoursInput): HoursBreakdown {
  return {
    taskHours: sumWorkedHours(input.tasks, input.workingDayKeys),
    bugHours: sumWorkedHours(input.bugs, input.workingDayKeys),
  };
}

function bucketHours(
  items: readonly WorkedHoursItem[],
  workingDayKeys: ReadonlySet<string>,
  add: (dayKey: string, hours: number) => void,
): void {
  for (const item of items) {
    if (!countsAsWorkedHours(item, workingDayKeys)) continue;
    add(item.workingDate as string, item.loggedHours ?? 0);
  }
}

/**
 * Serie por día: una entrada por CADA día de `workingDayKeys` (0 si no hubo
 * horas), en el orden de iteración del set.
 */
export function computeHoursByDay(
  input: WorkedHoursInput,
): ReadonlyMap<string, HoursBreakdown> {
  const byDay = new Map<string, HoursBreakdown>();
  for (const dayKey of input.workingDayKeys) {
    byDay.set(dayKey, { ...EMPTY_HOURS_BREAKDOWN });
  }
  bucketHours(input.tasks, input.workingDayKeys, (day, hours) => {
    const entry = byDay.get(day);
    if (entry) entry.taskHours += hours;
  });
  bucketHours(input.bugs, input.workingDayKeys, (day, hours) => {
    const entry = byDay.get(day);
    if (entry) entry.bugHours += hours;
  });
  for (const [day, entry] of byDay) {
    byDay.set(day, {
      taskHours: roundHours(entry.taskHours),
      bugHours: roundHours(entry.bugHours),
    });
  }
  return byDay;
}

/**
 * Variante grupo: desglose por persona. La identidad la resuelve el
 * consumidor (igualdad de displayName en el reporte; roster normalizado en
 * el sprint). Resolver `null` descarta el item. Solo devuelve personas con
 * horas > 0; el consumidor completa con ceros a quien deba aparecer igual.
 */
export type PersonKeyResolver = (assignedTo: string | undefined) => string | null;

export function computeHoursByPerson(
  input: WorkedHoursInput,
  resolvePersonKey: PersonKeyResolver,
): ReadonlyMap<string, HoursBreakdown> {
  const byPerson = new Map<string, HoursBreakdown>();
  const accumulate = (
    items: readonly WorkedHoursItem[],
    field: keyof HoursBreakdown,
  ) => {
    for (const item of items) {
      if (!countsAsWorkedHours(item, input.workingDayKeys)) continue;
      const key = resolvePersonKey(item.assignedTo);
      if (key === null) continue;
      const entry = byPerson.get(key) ?? { ...EMPTY_HOURS_BREAKDOWN };
      entry[field] += item.loggedHours ?? 0;
      byPerson.set(key, entry);
    }
  };
  accumulate(input.tasks, "taskHours");
  accumulate(input.bugs, "bugHours");
  for (const [key, entry] of byPerson) {
    byPerson.set(key, {
      taskHours: roundHours(entry.taskHours),
      bugHours: roundHours(entry.bugHours),
    });
  }
  return byPerson;
}

/**
 * Suma de una lista YA visible en la UI (p. ej. badge de sprint-items tras
 * filtros del listado). Deliberadamente SIN reglas de negocio: no es una
 * métrica, es el total de lo que el usuario está viendo.
 */
export function sumLoggedHours(
  items: readonly Pick<WorkedHoursItem, "loggedHours">[],
): number {
  let total = 0;
  for (const item of items) {
    if (typeof item.loggedHours !== "number" || !Number.isFinite(item.loggedHours)) {
      continue;
    }
    total += item.loggedHours;
  }
  return roundHours(total);
}
