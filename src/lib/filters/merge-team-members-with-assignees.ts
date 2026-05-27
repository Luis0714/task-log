import { assigneeMatchesMember, normalizePersonName } from "@/lib/filters/person-name";
import type { AdoTeamMemberDto, AdoWorkItemOptionDto } from "@/lib/schemas/ado-catalog";

const SPRINT_ASSIGNEE_ID_PREFIX = "sprint-assignee:";

export function mergeTeamMembersWithWorkItemAssignees(
  members: readonly AdoTeamMemberDto[],
  items: readonly Pick<AdoWorkItemOptionDto, "assignedTo">[],
): AdoTeamMemberDto[] {
  const merged: AdoTeamMemberDto[] = [...members];

  for (const item of items) {
    const displayName = item.assignedTo?.trim();
    if (!displayName || assigneeMatchesMember(merged, displayName)) continue;

    merged.push({
      id: `${SPRINT_ASSIGNEE_ID_PREFIX}${normalizePersonName(displayName)}`,
      displayName,
    });
  }

  return merged.sort((a, b) =>
    a.displayName.localeCompare(b.displayName, "es"),
  );
}
