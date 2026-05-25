function getNameParts(displayName: string): string[] {
  return displayName.trim().split(/\s+/).filter(Boolean);
}

/** Nombre corto: primer y último segmento (misma base que las iniciales). */
export function getShortDisplayName(displayName: string): string {
  const parts = getNameParts(displayName);
  if (parts.length === 0) return displayName.trim() || "?";
  if (parts.length === 1) return parts[0]!;
  return `${parts[0]} ${parts[parts.length - 1]}`;
}

export function getUserInitials(displayName: string): string {
  const parts = getNameParts(displayName);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[parts.length - 1]![0] ?? ""}`.toUpperCase();
}
