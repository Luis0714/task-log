import type { AdoTeamMemberDto, AdoWorkItemOptionDto } from "@/lib/schemas/ado-catalog";
import type { PbiStateBar } from "@/lib/dashboard/pbi-state-chart-data";
import type { SprintStatusMapping } from "@/lib/dashboard/sprint-status-mapping";
import {
  buildParentTitleLookup,
  buildSprintBugDetailItems,
  isSprintBugAttended,
} from "@/lib/sprints/build-sprint-bug-detail-items";
import { buildSprintBugAssigneeRows } from "@/lib/sprints/build-sprint-bug-assignee-rows";
import type { SprintBugQualityMetrics } from "@/lib/sprints/sprint-stats-types";

function buildBugStateBars(bugs: readonly AdoWorkItemOptionDto[]): PbiStateBar[] {
  const stateMap = new Map<string, { id: number; title: string }[]>();

  for (const bug of bugs) {
    const state = bug.state?.trim() || "Sin estado";
    const existing = stateMap.get(state);
    if (existing) {
      existing.push({ id: bug.id, title: bug.title });
    } else {
      stateMap.set(state, [{ id: bug.id, title: bug.title }]);
    }
  }

  return [...stateMap.entries()]
    .map(([state, items]) => ({ state, count: items.length, items }))
    .sort((left, right) => right.count - left.count || left.state.localeCompare(right.state, "es"));
}

function countGoalStoriesWithOpenBugs(
  bugs: readonly AdoWorkItemOptionDto[],
  goalWorkItemIds: ReadonlySet<number>,
  bugMapping: SprintStatusMapping,
): number {
  const storiesWithOpenBugs = new Set<number>();

  for (const bug of bugs) {
    const parentId = bug.parentId;
    if (!parentId || !goalWorkItemIds.has(parentId)) continue;
    if (!isSprintBugAttended(bug.state, bugMapping)) {
      storiesWithOpenBugs.add(parentId);
    }
  }

  return storiesWithOpenBugs.size;
}

export type BuildBugQualityMetricsInput = {
  bugs: readonly AdoWorkItemOptionDto[];
  goalWorkItemIds: ReadonlySet<number>;
  parentTitlesById?: ReadonlyMap<number, string>;
  /** Roster del equipo + asignados del sprint (misma fuente que filtros de HUs). */
  assigneeRoster?: readonly AdoTeamMemberDto[];
  bugMapping: SprintStatusMapping;
};

export function buildBugQualityMetrics(input: BuildBugQualityMetricsInput): SprintBugQualityMetrics {
  const { bugs, goalWorkItemIds, parentTitlesById, assigneeRoster = [], bugMapping } = input;
  let attended = 0;
  let unassigned = 0;
  let goalBugsTotal = 0;
  let goalBugsOpen = 0;

  for (const bug of bugs) {
    if (!bug.assignedTo?.trim()) unassigned += 1;

    const attendedBug = isSprintBugAttended(bug.state, bugMapping);
    if (attendedBug) attended += 1;

    const parentId = bug.parentId;
    if (parentId && goalWorkItemIds.has(parentId)) {
      goalBugsTotal += 1;
      if (!attendedBug) goalBugsOpen += 1;
    }
  }

  const total = bugs.length;
  const open = total - attended;

  return {
    total,
    open,
    attended,
    unassigned,
    attendedPercent: total > 0 ? Math.round((attended / total) * 100) : 0,
    stateBars: buildBugStateBars(bugs),
    assigneeRows: buildSprintBugAssigneeRows(bugs, assigneeRoster, bugMapping),
    goalBugsTotal,
    goalBugsOpen,
    goalStoriesWithOpenBugs: countGoalStoriesWithOpenBugs(bugs, goalWorkItemIds, bugMapping),
    items: buildSprintBugDetailItems({ bugs, goalWorkItemIds, parentTitlesById, bugMapping }),
  };
}

export { buildParentTitleLookup };

export function collectGoalWorkItemIds(
  stories: readonly { workItemId: number; includedInGoal: boolean; goalStatus: string }[],
): Set<number> {
  return new Set(
    stories
      .filter(
        (story) =>
          story.includedInGoal &&
          story.goalStatus !== "excluded" &&
          story.goalStatus !== "no_target",
      )
      .map((story) => story.workItemId),
  );
}