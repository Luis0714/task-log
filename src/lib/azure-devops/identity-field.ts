/** Valor legible de un campo Identity de Azure DevOps (AssignedTo, Custom.*, etc.). */
export function parseIdentityDisplayName(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (value && typeof value === "object" && "displayName" in value) {
    const displayName = (value as { displayName?: string }).displayName;
    return typeof displayName === "string" ? displayName.trim() : "";
  }
  return "";
}

/** Formato aceptado por el PATCH de campos Identity en ADO. */
export function formatIdentityPatchValue(
  displayName: string,
  uniqueName?: string | null,
): string {
  const name = displayName.trim();
  const unique = uniqueName?.trim();
  if (!name) return "";
  if (!unique) return name;
  if (name.includes("<") && name.includes(">")) return name;
  return `${name} <${unique}>`;
}
