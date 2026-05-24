/** Campo de fecha de trabajo en Tasks (configurable vía env en servidor). */
export function resolveWorkingDateFieldName(): string {
  return (
    process.env.AZDO_WORKING_DATE_FIELD?.trim() || "Microsoft.VSTS.Scheduling.StartDate"
  );
}

/** Normaliza un valor de fecha ADO a clave local YYYY-MM-DD. */
export function toWorkingDateKey(
  fieldValue: string | number | undefined | null,
): string | undefined {
  if (fieldValue === undefined || fieldValue === null) return undefined;
  const raw = String(fieldValue).trim();
  if (!raw) return undefined;

  const key = raw.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(key) ? key : undefined;
}
