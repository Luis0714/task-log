import { toWorkingDateKey } from "@/lib/azure-devops/working-date-field";

/** HH:mm (24 h). */
export const WORKING_TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

/** Hora por defecto al crear tareas (evita medianoche UTC en campos DateTime de ADO). */
export const DEFAULT_WORKING_TIME = "09:00";

export function getDefaultWorkingTime(): string {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

export function isValidWorkingTime(value: string): boolean {
  return WORKING_TIME_PATTERN.test(value.trim());
}

/** Extrae HH:mm del valor DateTime de ADO en la zona indicada; si no hay hora, usa DEFAULT_WORKING_TIME. */
export function extractWorkingTimeFromAdoField(
  fieldValue: string | number | undefined | null,
  timeZone: string,
): string {
  if (fieldValue === undefined || fieldValue === null) {
    return DEFAULT_WORKING_TIME;
  }

  const raw = String(fieldValue).trim();
  if (!raw.includes("T")) {
    return DEFAULT_WORKING_TIME;
  }

  const instant = new Date(raw);
  if (Number.isNaN(instant.getTime())) {
    return DEFAULT_WORKING_TIME;
  }

  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });

  let hour = "00";
  let minute = "00";
  for (const part of formatter.formatToParts(instant)) {
    if (part.type === "hour") hour = part.value;
    if (part.type === "minute") minute = part.value;
  }

  return `${hour}:${minute}`;
}

export function resolveWorkingTimeFromFields(
  fields: Record<string, string | number | undefined> | undefined,
  workingDateFieldName: string,
  timeZone: string,
): string {
  if (!fields) return DEFAULT_WORKING_TIME;
  return extractWorkingTimeFromAdoField(fields[workingDateFieldName], timeZone);
}

function getTimeZoneOffsetMinutes(timeZone: string, date: Date): number {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });

  const parts = formatter.formatToParts(date);
  const values: Partial<Record<"year" | "month" | "day" | "hour" | "minute" | "second", number>> =
    {};

  for (const part of parts) {
    if (part.type === "literal") continue;
    values[part.type as keyof typeof values] = Number(part.value);
  }

  const asUtc = Date.UTC(
    values.year ?? 0,
    (values.month ?? 1) - 1,
    values.day ?? 1,
    values.hour ?? 0,
    values.minute ?? 0,
    values.second ?? 0,
  );

  return (asUtc - date.getTime()) / 60_000;
}

/** Convierte fecha civil + hora local (IANA) a ISO UTC para campos DateTime de Azure DevOps. */
export function toAdoDateTimeValue(dateKey: string, time: string, timeZone: string): string {
  const match = WORKING_TIME_PATTERN.exec(time.trim());
  if (!match) {
    throw new Error("Hora inválida.");
  }

  const [year, month, day] = dateKey.split("-").map((part) => Number(part));
  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  const utcGuess = new Date(Date.UTC(year, month - 1, day, hours, minutes, 0, 0));
  const offsetMinutes = getTimeZoneOffsetMinutes(timeZone, utcGuess);
  const utcMs = Date.UTC(year, month - 1, day, hours, minutes, 0, 0) - offsetMinutes * 60_000;

  return new Date(utcMs).toISOString();
}

/**
 * Valor para PATCH/POST del campo de fecha de trabajo en ADO.
 * Si hay hora, envía DateTime; si no, conserva solo la fecha (YYYY-MM-DD).
 */
export function resolveAdoWorkingDateFieldValue(
  workingDate: string | undefined,
  workingTime: string | undefined,
  timeZone: string,
): string | undefined {
  if (!workingDate?.trim()) return undefined;

  const dateKey = toWorkingDateKey(workingDate, timeZone) ?? workingDate.trim().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) return undefined;

  const time = workingTime?.trim();
  if (!time) return dateKey;
  if (!isValidWorkingTime(time)) return dateKey;

  return toAdoDateTimeValue(dateKey, time, timeZone);
}
