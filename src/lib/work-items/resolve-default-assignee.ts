import type { AdoTeamMemberDto } from "@/lib/schemas/ado-catalog";

/** Valor por defecto de un responsable: existente en el WI o el usuario conectado. */
export function resolveDefaultAssignee(
  existingValue: string | undefined,
  currentUserDisplayName: string | null | undefined,
  members: readonly AdoTeamMemberDto[],
): string {
  const trimmed = existingValue?.trim();
  if (trimmed) return trimmed;

  const userName = currentUserDisplayName?.trim();
  if (!userName) return "";

  const member = members.find(
    (entry) =>
      entry.displayName === userName ||
      entry.uniqueName?.toLowerCase() === userName.toLowerCase(),
  );

  return member?.displayName ?? userName;
}
