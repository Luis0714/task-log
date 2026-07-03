import { findTeamMemberByAssigneeName } from "@/lib/filters/person-name";
import type { AdoTeamMemberDto } from "@/lib/schemas/ado-catalog";

/** Alinea un nombre con el displayName del equipo (para que el Select lo reconozca). */
export function resolveTeamMemberDisplayName(
  name: string | undefined,
  members: readonly AdoTeamMemberDto[],
): string {
  const trimmed = name?.trim();
  if (!trimmed) return "";

  const member = findTeamMemberByAssigneeName(members, trimmed);
  return member?.displayName ?? trimmed;
}

/** Valor de borrador para un responsable: el valor guardado en ADO, o vacío. */
export function resolveResponsableDraftValue(
  existingValue: string | undefined,
  members: readonly AdoTeamMemberDto[],
): string {
  const stored = existingValue?.trim();
  if (stored) {
    return resolveTeamMemberDisplayName(stored, members);
  }
  return "";
}

/** @deprecated Usa resolveResponsableDraftValue */
export function resolveDefaultAssignee(
  existingValue: string | undefined,
  _currentUserDisplayName: string | null | undefined,
  members: readonly AdoTeamMemberDto[],
): string {
  return resolveResponsableDraftValue(existingValue, members);
}
