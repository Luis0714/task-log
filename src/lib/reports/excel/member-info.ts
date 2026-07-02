import "server-only";

export type MemberInfo = { role: string; email: string };

type NeosUserRow = {
  displayName: string | null;
  email: string | null;
  roleDisplayName: string | null;
};

function normalize(s: string): string {
  return s.trim().normalize("NFC").toLowerCase();
}

/**
 * Builds a lookup map keyed by normalized displayName.
 * Source of truth: NeosView users table (has role + email).
 */
export function buildMemberInfoMap(neosUsers: NeosUserRow[]): Map<string, MemberInfo> {
  const map = new Map<string, MemberInfo>();
  for (const u of neosUsers) {
    if (!u.displayName) continue;
    map.set(normalize(u.displayName), {
      role: u.roleDisplayName ?? "",
      email: u.email ?? "",
    });
  }
  return map;
}

export function lookupMember(map: Map<string, MemberInfo>, assignee: string): MemberInfo {
  return map.get(normalize(assignee)) ?? { role: "", email: "" };
}
