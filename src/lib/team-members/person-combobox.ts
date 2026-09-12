import type { AdoTeamMemberDto } from "@/lib/schemas/ado-catalog";

export function extractTeamMemberIds(
  value: AdoTeamMemberDto | readonly AdoTeamMemberDto[] | null,
): string[] {
  if (!value) return [];
  const members = Array.isArray(value) ? value : [value];
  return members.map((member) => member.id);
}

export function coerceTeamMembers(value: unknown): AdoTeamMemberDto[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isTeamMember);
}

function isTeamMember(value: unknown): value is AdoTeamMemberDto {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<AdoTeamMemberDto>;
  return typeof candidate.id === "string" && typeof candidate.displayName === "string";
}
