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

/**
 * Valor de borrador para un responsable: valor guardado en ADO o el usuario conectado
 * (solo si defaultToCurrentUser).
 */
export function resolveResponsableDraftValue(
  existingValue: string | undefined,
  currentUserDisplayName: string | null | undefined,
  members: readonly AdoTeamMemberDto[],
  defaultToCurrentUser: boolean,
): string {
  const stored = existingValue?.trim();
  if (stored) {
    return resolveTeamMemberDisplayName(stored, members);
  }

  if (!defaultToCurrentUser) return "";

  const userName = currentUserDisplayName?.trim();
  if (!userName) return "";

  return resolveTeamMemberDisplayName(userName, members);
}

/** @deprecated Usa resolveResponsableDraftValue */
export function resolveDefaultAssignee(
  existingValue: string | undefined,
  currentUserDisplayName: string | null | undefined,
  members: readonly AdoTeamMemberDto[],
): string {
  return resolveResponsableDraftValue(
    existingValue,
    currentUserDisplayName,
    members,
    true,
  );
}
