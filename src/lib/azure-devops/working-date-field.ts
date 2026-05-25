/** Campo de fecha de trabajo en Tasks (configurable vía env en servidor). */
export function resolveWorkingDateFieldName(): string {
  return (
    process.env.AZDO_WORKING_DATE_FIELD?.trim() || "Microsoft.VSTS.Scheduling.StartDate"
  );
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
