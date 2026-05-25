const CUSTOM_WORKING_DATE_FIELD = "Custom.WorkingDate";

const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

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

/** Campo de fecha de trabajo en Tasks (configurable vía env en servidor). */
export function resolveWorkingDateFieldName(): string {
  return (
    process.env.AZDO_WORKING_DATE_FIELD?.trim() || "Microsoft.VSTS.Scheduling.StartDate"
  );
}

/** Campos de fecha a rellenar al actualizar estado (reglas Required en Custom.WorkingDate, etc.). */
export function getWorkingDateFieldNamesForUpdate(): readonly string[] {
  const primary = resolveWorkingDateFieldName();
  return [...new Set([primary, CUSTOM_WORKING_DATE_FIELD])];
}

const FALLBACK_DATE_FIELDS = [
  "Microsoft.VSTS.Scheduling.StartDate",
  "Microsoft.VSTS.Scheduling.FinishDate",
  "Microsoft.VSTS.Scheduling.TargetDate",
  "System.CreatedDate",
] as const;

/** Campos a pedir a ADO para resolver workingDate (primario + respaldos). */
export function getWorkItemDateFieldNames(): readonly string[] {
  const primary = resolveWorkingDateFieldName();
  const ordered = [primary, ...FALLBACK_DATE_FIELDS.filter((field) => field !== primary)];
  return [...new Set(ordered)];
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

/** Primera fecha válida entre el campo configurado y respaldos típicos de Task. */
export function resolveWorkingDateKeyFromFields(
  fields: Record<string, string | number | undefined> | undefined,
): string | undefined {
  if (!fields) return undefined;

  for (const fieldName of getWorkItemDateFieldNames()) {
    const key = toWorkingDateKey(fields[fieldName]);
    if (key) return key;
  }

  return undefined;
}
