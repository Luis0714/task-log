import { formatIdentityPatchValue } from "@/lib/azure-devops/identity-field";
import { listTeamMembers } from "@/lib/azure-devops/work-item-type-states";
import type { AdoCallerAuth } from "@/lib/azure-devops/resolve-auth";
import type { AdoTeamMemberDto } from "@/lib/schemas/ado-catalog";

function findMember(
  members: readonly AdoTeamMemberDto[],
  displayName: string,
): AdoTeamMemberDto | undefined {
  const trimmed = displayName.trim();
  return members.find(
    (member) =>
      member.displayName === trimmed ||
      member.uniqueName?.toLowerCase() === trimmed.toLowerCase(),
  );
}

export async function resolveIdentityPatchValue(
  auth: AdoCallerAuth,
  displayName: string,
  team?: string | null,
  membersCache?: readonly AdoTeamMemberDto[],
): Promise<string> {
  const trimmed = displayName.trim();
  if (!trimmed) return "";

  let members = membersCache;
  if (!members && team?.trim()) {
    members = await listTeamMembers(auth, team.trim());
  }

  if (members?.length) {
    const member = findMember(members, trimmed);
    if (member) {
      return formatIdentityPatchValue(member.displayName, member.uniqueName);
    }
  }

  return formatIdentityPatchValue(trimmed);
}
