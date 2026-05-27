export type AssigneeMemberLookup = {
  displayName: string;
  uniqueName?: string;
};

export function normalizePersonName(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

export function findTeamMemberByAssigneeName<T extends AssigneeMemberLookup>(
  members: readonly T[],
  name: string,
): T | undefined {
  const normalized = normalizePersonName(name);
  if (!normalized) return undefined;

  return members.find((member) => {
    if (normalizePersonName(member.displayName) === normalized) return true;
    const unique = member.uniqueName?.trim();
    if (unique && normalizePersonName(unique) === normalized) return true;
    if (
      unique &&
      normalized.includes("@") &&
      unique.toLowerCase() === name.trim().toLowerCase()
    ) {
      return true;
    }
    return false;
  });
}

export function assigneeMatchesMember(
  members: readonly AssigneeMemberLookup[],
  assigneeName: string,
): boolean {
  return findTeamMemberByAssigneeName(members, assigneeName) !== undefined;
}
