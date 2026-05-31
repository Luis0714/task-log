import type { AdoTeamMemberDto } from "@/lib/schemas/ado-catalog";
import { buildSprintBugAssigneeRowsFromDetailItems } from "@/lib/sprints/build-sprint-bug-assignee-rows";
import type {
  SprintSnapshotOperationalMetrics,
  SprintSnapshotStatsPayload,
} from "@/lib/sprints/sprint-snapshot-types";

function enrichOperationalAssigneeRows(
  operational: SprintSnapshotOperationalMetrics,
  assigneeRoster: readonly AdoTeamMemberDto[],
): SprintSnapshotOperationalMetrics {
  return {
    ...operational,
    bugs: {
      ...operational.bugs,
      assigneeRows: buildSprintBugAssigneeRowsFromDetailItems(
        operational.bugs.items ?? [],
        assigneeRoster,
      ),
    },
  };
}

export function enrichSnapshotStatsPayloadAssigneeRows(
  payload: SprintSnapshotStatsPayload,
  assigneeRoster: readonly AdoTeamMemberDto[],
): SprintSnapshotStatsPayload {
  return {
    team: enrichOperationalAssigneeRows(payload.team, assigneeRoster),
    goal: enrichOperationalAssigneeRows(payload.goal, assigneeRoster),
  };
}
