import { mergeTeamMembersWithWorkItemAssignees } from "@/lib/filters/merge-team-members-with-assignees";
import { findTeamMemberByAssigneeName } from "@/lib/filters/person-name";
import type { AdoTeamMemberDto, AdoWorkItemOptionDto } from "@/lib/schemas/ado-catalog";
import type { SprintStatusMapping } from "@/lib/dashboard/sprint-status-mapping";
import { isSprintBugAttended } from "@/lib/sprints/build-sprint-bug-detail-items";
import { SPRINT_BUG_UNASSIGNED_LABEL } from "@/lib/sprints/filter-sprint-bug-detail-items";
import type { SprintBugAssigneeRow, SprintBugDetailItem } from "@/lib/sprints/sprint-stats-types";

export type SprintBugAssigneeSource = {
  assignedTo: string | null;
  isAttended: boolean;
};

function emptyAssigneeRow(assignee: string, imageUrl?: string): SprintBugAssigneeRow {
  return { assignee, imageUrl, total: 0, open: 0, attended: 0 };
}

function resolveBugAssigneeLabel(
  roster: readonly AdoTeamMemberDto[],
  assignedTo: string | undefined | null,
): string {
  const trimmed = assignedTo?.trim();
  if (!trimmed) return SPRINT_BUG_UNASSIGNED_LABEL;
  return findTeamMemberByAssigneeName(roster, trimmed)?.displayName ?? trimmed;
}

function toAssigneeSourceFromWorkItem(
  bug: AdoWorkItemOptionDto,
  mapping: SprintStatusMapping,
): SprintBugAssigneeSource {
  return {
    assignedTo: bug.assignedTo?.trim() || null,
    isAttended: isSprintBugAttended(bug.state, mapping),
  };
}

function toAssigneeSourceFromDetailItem(item: SprintBugDetailItem): SprintBugAssigneeSource {
  return {
    assignedTo: item.assignedTo,
    isAttended: item.isAttended,
  };
}

function countBugSourcesByAssignee(
  sources: readonly SprintBugAssigneeSource[],
  roster: readonly AdoTeamMemberDto[],
): Map<string, SprintBugAssigneeRow> {
  const counts = new Map<string, SprintBugAssigneeRow>();

  for (const source of sources) {
    const assignee = resolveBugAssigneeLabel(roster, source.assignedTo);
    const imageUrl = roster.find((member) => member.displayName === assignee)?.imageUrl;
    const current = counts.get(assignee) ?? emptyAssigneeRow(assignee, imageUrl);
    current.total += 1;

    if (source.isAttended) {
      current.attended += 1;
    } else {
      current.open += 1;
    }

    counts.set(assignee, current);
  }

  return counts;
}

function sortBugAssigneeRows(rows: SprintBugAssigneeRow[]): SprintBugAssigneeRow[] {
  return [...rows].sort((left, right) => {
    const openDiff = right.open - left.open;
    if (openDiff !== 0) return openDiff;

    const totalDiff = right.total - left.total;
    if (totalDiff !== 0) return totalDiff;

    if (left.assignee === SPRINT_BUG_UNASSIGNED_LABEL) return 1;
    if (right.assignee === SPRINT_BUG_UNASSIGNED_LABEL) return -1;

    return left.assignee.localeCompare(right.assignee, "es");
  });
}

function buildSprintBugAssigneeRowsFromSources(
  sources: readonly SprintBugAssigneeSource[],
  assigneeRoster: readonly AdoTeamMemberDto[],
): SprintBugAssigneeRow[] {
  const roster = mergeTeamMembersWithWorkItemAssignees(
    assigneeRoster,
    sources.map((source) => ({ assignedTo: source.assignedTo ?? undefined })),
  );
  const counts = countBugSourcesByAssignee(sources, roster);

  const rows = roster.map(
    (member) =>
      counts.get(member.displayName) ??
      emptyAssigneeRow(member.displayName, member.imageUrl),
  );

  const unassignedRow = counts.get(SPRINT_BUG_UNASSIGNED_LABEL);
  if (unassignedRow) {
    rows.push(unassignedRow);
  }

  return sortBugAssigneeRows(rows);
}

/** Roster del equipo (como en HUs) + filas en cero para miembros sin bugs del alcance. */
export function buildSprintBugAssigneeRows(
  bugs: readonly AdoWorkItemOptionDto[],
  assigneeRoster: readonly AdoTeamMemberDto[],
  mapping: SprintStatusMapping,
): SprintBugAssigneeRow[] {
  return buildSprintBugAssigneeRowsFromSources(
    bugs.map((bug) => toAssigneeSourceFromWorkItem(bug, mapping)),
    assigneeRoster,
  );
}

export function buildSprintBugAssigneeRowsFromDetailItems(
  items: readonly SprintBugDetailItem[],
  assigneeRoster: readonly AdoTeamMemberDto[],
): SprintBugAssigneeRow[] {
  return buildSprintBugAssigneeRowsFromSources(
    items.map(toAssigneeSourceFromDetailItem),
    assigneeRoster,
  );
}