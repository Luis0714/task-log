import {
  assigneeMatchesMember,
  normalizePersonName,
} from "@/lib/filters/person-name";
import type { AdoTeamMemberDto, AdoWorkItemOptionDto } from "@/lib/schemas/ado-catalog";

const SPRINT_ASSIGNEE_ID_PREFIX = "sprint-assignee:";

export type SprintAssigneeSource = Pick<AdoWorkItemOptionDto, "assignedTo">;

/**
 * Añade al roster las personas que aparecen como asignados en el sprint
 * pero no pertenecen al equipo oficial.
 */
export function mergeTeamMembersWithWorkItemAssignees(
  members: readonly AdoTeamMemberDto[],
  items: readonly SprintAssigneeSource[],
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