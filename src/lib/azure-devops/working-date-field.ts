import { toAdoDateTimeValue } from "@/lib/date/ado-datetime";

export const DEFAULT_WORKING_DATE_FIELD = "Microsoft.VSTS.Scheduling.StartDate";

export const FALLBACK_DATE_FIELDS = [
  DEFAULT_WORKING_DATE_FIELD,
  "Microsoft.VSTS.Scheduling.FinishDate",
  "Microsoft.VSTS.Scheduling.TargetDate",
  "System.CreatedDate",
] as const;

const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const DEFAULT_READ_DATE_FIELDS: readonly string[] = [
  ...new Set([
    DEFAULT_WORKING_DATE_FIELD,
    ...FALLBACK_DATE_FIELDS.filter((field) => field !== DEFAULT_WORKING_DATE_FIELD),
  ]),
];

export function buildWorkItemDateFieldNames(primary: string): readonly string[] {
  const ordered = [primary, ...FALLBACK_DATE_FIELDS.filter((field) => field !== primary)];
  return [...new Set(ordered)];
}

/** Zona horaria del proyecto ADO (debe coincidir con la org en Azure DevOps). */
export function resolveAdoTimeZone(): string {
  return process.env.AZDO_TIMEZONE?.trim() || "America/Bogota";
}

function formatDateKeyInTimeZone(instant: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(instant);
}

/**
 * Normaliza un valor de fecha ADO a clave civil YYYY-MM-DD.
 * Los DateTime de ADO vienen en UTC; se convierten con AZDO_TIMEZONE para
 * coincidir con la fecha que muestra la UI de Azure DevOps.
 */
export function toWorkingDateKey(
  fieldValue: string | number | undefined | null,
  timeZone = resolveAdoTimeZone(),
): string | undefined {
  if (fieldValue === undefined || fieldValue === null) return undefined;
  const raw = String(fieldValue).trim();
  if (!raw) return undefined;

  const dateOnly = raw.slice(0, 10);
  if (!DATE_KEY_PATTERN.test(dateOnly)) return undefined;

  if (!raw.includes("T")) return dateOnly;

  const instant = new Date(raw);
  if (Number.isNaN(instant.getTime())) return dateOnly;

  const isUtcMidnight =
    instant.getUTCHours() === 0 &&
    instant.getUTCMinutes() === 0 &&
    instant.getUTCSeconds() === 0 &&
    instant.getUTCMilliseconds() === 0;

  if (isUtcMidnight) return dateOnly;

  return formatDateKeyInTimeZone(instant, timeZone);
}

/**
 * Convierte fecha civil + hora local (IANA) a ISO UTC para campos DateTime de Azure DevOps.
 * Delega en toAdoDateTimeValue para que toda la lógica de conversión viva en un único lugar.
 * Ej: ("2026-06-30", "11:25", "America/Bogota") → "2026-06-30T16:25:00.000Z"
 */
export function buildWorkingDateTimeValue(
  dateKey: string,
  timeStr: string,
  timeZone: string,
): string {
  try {
    return toAdoDateTimeValue(dateKey, timeStr, timeZone);
  } catch {
    return `${dateKey}T${timeStr}:00Z`;
  }
}

/** Primera fecha válida entre los campos indicados (p. ej. desde resolveProcessProfile). */
export function resolveWorkingDateKeyFromFields(
  fields: Record<string, string | number | undefined> | undefined,
  dateFieldNames: readonly string[] = DEFAULT_READ_DATE_FIELDS,
  timeZone = resolveAdoTimeZone(),
): string | undefined {
  if (!fields) return undefined;

  for (const fieldName of dateFieldNames) {
    const key = toWorkingDateKey(fields[fieldName], timeZone);
    if (key) return key;
  }

  return undefined;
}
