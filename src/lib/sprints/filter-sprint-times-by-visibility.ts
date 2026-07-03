import type { SprintTimesMetrics } from "@/lib/sprints/sprint-stats-types";

export function filterSprintTimesByVisibility(
  times: SprintTimesMetrics,
  hiddenAssignees: ReadonlySet<string>,
): SprintTimesMetrics {
  if (hiddenAssignees.size === 0) return times;
  return {
    ...times,
    rows: times.rows.filter((row) => !hiddenAssignees.has(row.assignee)),
  };
}
