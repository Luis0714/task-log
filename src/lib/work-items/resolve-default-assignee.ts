import type { AdoTeamMemberDto } from "@/lib/schemas/ado-catalog";

function normalizePersonName(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

function findTeamMember(
  members: readonly AdoTeamMemberDto[],
  name: string,
): AdoTeamMemberDto | undefined {
  const normalized = normalizePersonName(name);
  if (!normalized) return undefined;

  return members.find((member) => {
    if (normalizePersonName(member.displayName) === normalized) return true;
    const unique = member.uniqueName?.trim();
    if (unique && normalizePersonName(unique) === normalized) return true;
    if (unique && normalized.includes("@") && unique.toLowerCase() === name.trim().toLowerCase()) {
      return true;
    }
    return false;
  });
}

/** Alinea un nombre con el displayName del equipo (para que el Select lo reconozca). */
export function resolveTeamMemberDisplayName(
  name: string | undefined,
  members: readonly AdoTeamMemberDto[],
): string {
  const trimmed = name?.trim();
  if (!trimmed) return "";

  const member = findTeamMember(members, trimmed);
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
