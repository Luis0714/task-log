import { resolveAdoTimeZone, toWorkingDateKey } from "@/lib/azure-devops/working-date-field";
import {
  extractWorkingTimeFromAdoField,
} from "@/lib/date/ado-datetime";
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

/**
 * Divide un valor DateTime de ADO (`2026-07-14T13:00:00.000Z`) en una clave
 * civil `YYYY-MM-DD` y una hora `HH:mm`, ambos en la zona horaria del
 * proyecto. Es el espejo de `buildWorkingDateTimeValue` y se usa para
 * hidratar listados (la tabla de "Mis solicitudes", el form de edición).
 *
 * Devuelve `null` si el valor no trae `T…` (campo Date legacy) o no se puede
 * interpretar, para que el caller pueda distinguir "no hay dato" de "dato a
 * medianoche" (que sí trae `T00:00:00`).
 */
export function splitAdoDateTime(
  raw: string,
): { dateKey: string; timeStr: string } | null {
  const trimmed = raw.trim();
  if (!trimmed.includes("T")) return null;
  const timeZone = resolveAdoTimeZone();
  const dateKey = toWorkingDateKey(trimmed, timeZone, { isDateTimeField: true });
  if (!dateKey) return null;
  const timeStr = extractWorkingTimeFromAdoField(trimmed, timeZone);
  return { dateKey, timeStr };
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

export type BuildSolicitudDescriptionInput = Readonly<{
  tipo: string;
  persona: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  fechaReintegro: string;
  reintegroTime: string;
}>;

/**
 * Descripción auto-generada en lenguaje natural (HTML, los valores van en
 * negrita). La usa `RichTextarea` (TipTap) como contenido inicial: se guarda
 * en ADO como HTML, que Azure DevOps renderiza correctamente.
 *
 * Devuelve `""` si falta cualquier dato: en ese caso el formulario todavía
 * no tiene suficiente info para componer la frase.
 */
export function buildSolicitudDescription(input: BuildSolicitudDescriptionInput): string {
  const {
    tipo,
    persona,
    startDate,
    startTime,
    endDate,
    endTime,
    fechaReintegro,
    reintegroTime,
  } = input;
  if (
    !tipo.trim() ||
    !persona.trim() ||
    !startDate ||
    !startTime ||
    !endDate ||
    !endTime ||
    !fechaReintegro ||
    !reintegroTime
  ) {
    return "";
  }
  const strong = (value: string): string => `<strong>${value}</strong>`;
  return (
    `Solicitud de ${strong(tipo.trim())} a nombre de ${strong(persona.trim())} ` +
    `desde el día ${strong(formatDateKeyDMY(startDate))} a las ${strong(formatTime12h(startTime))} ` +
    `hasta el día ${strong(formatDateKeyDMY(endDate))} a las ${strong(formatTime12h(endTime))}. ` +
    `Reintegrándose al equipo el día ${strong(formatDateKeyDMY(fechaReintegro))} ` +
    `a las ${strong(formatTime12h(reintegroTime))}.`
  );
}

const SPANISH_MONTH_ABBR = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
] as const;

/**
 * Formato largo en español: "10 de jun a las 08:00 AM". Pensado para tablas
 * y listados donde cada fecha lleva su hora al lado. Si no se pasa hora
 * devuelve solo la fecha: "10 de jun". Reutilizable fuera de solicitudes.
 */
export function formatSolicitudDateTime(dateKey: string, timeStr?: string | null): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey.trim());
  if (!match) return dateKey;
  const monthIndex = Number(match[2]) - 1;
  if (monthIndex < 0 || monthIndex > 11) return dateKey;
  const day = Number(match[3]);
  const monthAbbr = SPANISH_MONTH_ABBR[monthIndex];
  const datePart = `${day} de ${monthAbbr}`;
  const trimmedTime = timeStr?.trim() ?? "";
  if (!trimmedTime) return datePart;
  const formattedTime = formatTime12h(trimmedTime);
  return `${datePart} a las ${formattedTime}`;
}

/** "HH:mm" 24h → "hh:mm AM/PM" en español (12:00 AM, 12:00 PM, 01:30 PM). */
export function formatTime12h(time: string): string {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time.trim());
  if (!match) return time;
  const hours24 = Number(match[1]);
  const minutes = match[2];
  if (hours24 > 23) return time;
  const period = hours24 >= 12 ? "PM" : "AM";
  const hours12 = hours24 % 12 || 12;
  return `${String(hours12).padStart(2, "0")}:${minutes} ${period}`;
}
