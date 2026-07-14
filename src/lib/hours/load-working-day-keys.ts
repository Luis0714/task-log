import "server-only";

import { cache } from "react";

import { loadColombianHolidaysForRange, type Holiday } from "@/lib/holidays";
import { listWorkingDayKeysBetween, toLocalDateKey } from "@/lib/working-days";

/**
 * Calendario ÚNICO de la plataforma: lunes a viernes menos festivos
 * colombianos del holiday service (estrategia librería/API). Los días no
 * laborables de ADO y AZDO_NON_WORKING_DATES no participan.
 */
export const loadWorkingDayKeysInRange = cache(
  async function loadWorkingDayKeysInRange(
    fromIso: string,
    toIso: string,
  ): Promise<string[]> {
    const holidays = await loadColombianHolidaysForRange(fromIso, toIso);
    return filterWorkingDays(fromIso, toIso, holidays);
  },
);

/**
 * Solo las fechas de festivos del rango, para APIs puras que reciben
 * `nonWorkingDates` (p. ej. `listSprintWorkingDays`, pickers de día).
 */
export const loadHolidayDateKeysInRange = cache(
  async function loadHolidayDateKeysInRange(
    fromIso: string,
    toIso: string,
  ): Promise<string[]> {
    const holidays = await loadColombianHolidaysForRange(fromIso, toIso);
    return holidays.map((holiday) => holiday.date);
  },
);

export function filterWorkingDays(
  fromIso: string,
  toIso: string,
  holidays: readonly Holiday[],
): string[] {
  const nonWorkingDates = new Set(holidays.map((h) => h.date));
  return listWorkingDayKeysBetween(fromIso, toIso, { nonWorkingDates });
}

const PICKER_WINDOW_DAYS = 366;

/**
 * Festivos en una ventana de ±1 año alrededor de hoy, para pickers de día
 * que no tienen un rango propio. Degrada a lista vacía si el proveedor de
 * festivos falla: un picker sin festivos marcados no debe bloquear la vista.
 */
export const loadHolidayDateKeysAroundToday = cache(
  async function loadHolidayDateKeysAroundToday(): Promise<string[]> {
    const from = new Date();
    from.setDate(from.getDate() - PICKER_WINDOW_DAYS);
    const to = new Date();
    to.setDate(to.getDate() + PICKER_WINDOW_DAYS);
    try {
      return await loadHolidayDateKeysInRange(toLocalDateKey(from), toLocalDateKey(to));
    } catch {
      return [];
    }
  },
);
