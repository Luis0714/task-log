import "server-only";

import { cache } from "react";

import { loadColombianHolidaysForRange, type Holiday } from "@/lib/holidays";
import { logApiError } from "@/lib/errors/log-api-error";
import { listWorkingDayKeysBetween, normalizeIsoDateKey, toLocalDateKey } from "@/lib/working-days";

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
    // ADO devuelve startDate/finishDate como ISO con sufijo de hora
    // (`"2026-07-20T00:00:00.000Z"`); normalizamos a `"YYYY-MM-DD"` para
    // que el filtro del holiday service y el cálculo del calendario
    // coincidan con el formato interno. Sin esto, festivo entre semana
    // se cuela como hábil (bug del 2026-07-20 reportado por el equipo).
    const fromKey = normalizeIsoDateKey(fromIso);
    const toKey = normalizeIsoDateKey(toIso);
    const holidays = await loadColombianHolidaysForRange(fromKey, toKey);
    return filterWorkingDays(fromKey, toKey, holidays);
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
    const fromKey = normalizeIsoDateKey(fromIso);
    const toKey = normalizeIsoDateKey(toIso);
    const holidays = await loadColombianHolidaysForRange(fromKey, toKey);
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
 * festivos falla: un picker sin festivos marcados no debe bloquear la vista,
 * pero el fallo se loguea para que `GET /api/health/holidays` y los logs del
 * servidor lo expongan (un picker silenciosamente sin festivos era el modo en
 * que el 20-jul podía colarse como hábil en pickers).
 */
export const loadHolidayDateKeysAroundToday = cache(
  async function loadHolidayDateKeysAroundToday(): Promise<string[]> {
    const from = new Date();
    from.setDate(from.getDate() - PICKER_WINDOW_DAYS);
    const to = new Date();
    to.setDate(to.getDate() + PICKER_WINDOW_DAYS);
    try {
      return await loadHolidayDateKeysInRange(toLocalDateKey(from), toLocalDateKey(to));
    } catch (cause) {
      logApiError("loadHolidayDateKeysAroundToday", cause);
      return [];
    }
  },
);
