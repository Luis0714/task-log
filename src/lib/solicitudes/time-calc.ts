import {
  HOURS_PER_WORKING_DAY,
  addWorkingDayKeys,
  countWorkingDayKeysBetween,
  nextWorkingDayKey,
} from "@/lib/working-days";

/**
 * Lógica pura del cálculo bidireccional tiempo↔fechas de una solicitud
 * (novedad). Sin `server-only`: se usa tanto en el cliente (cálculo en vivo del
 * formulario) como en el backend (validación/conversión antes de crear en
 * Azure). Los festivos se inyectan como `nonWorkingDates` para no acoplar este
 * módulo al servicio de festivos.
 */

export type TimeUnit = "horas" | "dias";

const MINUTES_PER_DAY = 24 * 60;
const LAST_MINUTE_OF_DAY = MINUTES_PER_DAY - 1; // 23:59

export type NonWorkingDates = ReadonlySet<string> | undefined;

/** Convierte "HH:mm" a minutos desde medianoche, o `null` si es inválido. */
export function parseTimeToMinutes(time: string): number | null {
  const match = /^(\d{2}):(\d{2})$/.exec(time.trim());
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}

/** Convierte minutos desde medianoche a "HH:mm". */
export function minutesToTime(totalMinutes: number): string {
  const clamped = Math.max(0, Math.min(LAST_MINUTE_OF_DAY, Math.round(totalMinutes)));
  const hours = Math.floor(clamped / 60);
  const minutes = clamped % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

/** 1 día = 8 horas. */
export function daysToHours(days: number): number {
  return days * HOURS_PER_WORKING_DAY;
}

export function hoursToDays(hours: number): number {
  return hours / HOURS_PER_WORKING_DAY;
}

/** Horas que se envían a Azure a partir del valor + unidad del formulario. */
export function resolveAzureHours(value: number, unit: TimeUnit): number {
  const hours = unit === "dias" ? daysToHours(value) : value;
  return Math.round(hours * 100) / 100;
}

export type ComputeEndInput = Readonly<{
  startDate: string;
  startTime: string;
  value: number;
  unit: TimeUnit;
  nonWorkingDates?: NonWorkingDates;
}>;

export type ComputeEndResult =
  | { ok: true; endDate: string; endTime: string }
  | { ok: false; reason: "invalid-input" | "exceeds-day" };

/**
 * A partir de inicio + tiempo calcula la fecha/hora fin.
 * - `horas`: mismo día, `fin = inicio + horas`; falla si cruza la medianoche
 *   (regla MVP: `inicio + horas ≤ 23:59`).
 * - `dias`: avanza `value - 1` días hábiles (el día de inicio cuenta como el
 *   primer día hábil ocupado), saltando fines de semana y festivos.
 */
export function computeEndFromDuration(input: ComputeEndInput): ComputeEndResult {
  const { startDate, startTime, value, unit, nonWorkingDates } = input;
  if (!Number.isFinite(value) || value <= 0) return { ok: false, reason: "invalid-input" };

  if (unit === "horas") {
    const startMinutes = parseTimeToMinutes(startTime);
    if (startMinutes === null) return { ok: false, reason: "invalid-input" };
    const endMinutes = startMinutes + value * 60;
    if (endMinutes > LAST_MINUTE_OF_DAY) return { ok: false, reason: "exceeds-day" };
    return { ok: true, endDate: startDate, endTime: minutesToTime(endMinutes) };
  }

  const endDate = addWorkingDayKeys(startDate, Math.ceil(value) - 1, {
    nonWorkingDates,
  });
  if (!endDate) return { ok: false, reason: "invalid-input" };
  return { ok: true, endDate, endTime: startTime };
}

export type ComputeDurationInput = Readonly<{
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  nonWorkingDates?: NonWorkingDates;
}>;

export type ComputeDurationResult =
  | { ok: true; value: number; unit: TimeUnit }
  | { ok: false; reason: "invalid-input" | "end-before-start" };

/**
 * A partir de un rango inicio→fin calcula el tiempo:
 * - Mismo día: `horas` = diferencia de horas.
 * - Días distintos: `dias` = días hábiles inclusive entre ambas fechas
 *   (hacia Azure serán `dias × 8` horas).
 */
export function computeDurationFromRange(
  input: ComputeDurationInput,
): ComputeDurationResult {
  const { startDate, startTime, endDate, endTime, nonWorkingDates } = input;

  if (startDate === endDate) {
    const startMinutes = parseTimeToMinutes(startTime);
    const endMinutes = parseTimeToMinutes(endTime);
    if (startMinutes === null || endMinutes === null) {
      return { ok: false, reason: "invalid-input" };
    }
    if (endMinutes < startMinutes) return { ok: false, reason: "end-before-start" };
    const hours = Math.round(((endMinutes - startMinutes) / 60) * 100) / 100;
    return { ok: true, value: hours, unit: "horas" };
  }

  if (endDate < startDate) return { ok: false, reason: "end-before-start" };

  const businessDays = countWorkingDayKeysBetween(startDate, endDate, {
    nonWorkingDates,
  });
  if (businessDays <= 0) return { ok: false, reason: "invalid-input" };
  return { ok: true, value: businessDays, unit: "dias" };
}

/** Reintegro = siguiente día hábil estricto tras la fecha fin (CA-23). */
export function computeReintegro(
  endDate: string,
  nonWorkingDates?: NonWorkingDates,
): string | null {
  return nextWorkingDayKey(endDate, { nonWorkingDates });
}

/** Formatea una clave `YYYY-MM-DD` como `DD/MM/YYYY`. */
export function formatDateKeyDMY(dateKey: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey.trim());
  if (!match) return dateKey;
  return `${match[3]}/${match[2]}/${match[1]}`;
}

export type BuildTitleInput = Readonly<{
  tipo: string;
  persona: string;
  startDate: string;
}>;

/** Título autogenerado "[Tipo] – [Persona] – [fecha inicio]" (CA-26). */
export function buildSolicitudTitle(input: BuildTitleInput): string {
  const parts = [
    input.tipo.trim(),
    input.persona.trim(),
    formatDateKeyDMY(input.startDate),
  ].filter((part) => part.length > 0);
  return parts.join(" – ");
}
