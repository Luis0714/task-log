import type { SprintBugQualityMetrics, SprintStatsScreenData, SprintTimesMetrics } from "@/lib/sprints/sprint-stats-types";
import { EMPTY_SPRINT_TIMES_METRICS } from "@/lib/sprints/build-sprint-times-metrics";

export function normalizeSprintBugQualityMetrics(
  bugs: SprintBugQualityMetrics | null | undefined,
): SprintBugQualityMetrics {
  if (!bugs) {
    return {
      total: 0,
      open: 0,
      attended: 0,
      unassigned: 0,
      attendedPercent: 0,
      stateBars: [],
      assigneeRows: [],
      goalBugsTotal: 0,
      goalBugsOpen: 0,
      goalStoriesWithOpenBugs: 0,
      items: [],
    };
  }

  return {
    ...bugs,
    stateBars: bugs.stateBars ?? [],
    assigneeRows: bugs.assigneeRows ?? [],
    items: bugs.items ?? [],
  };
}

export function normalizeSprintTimesMetrics(
  times: SprintTimesMetrics | null | undefined,
): SprintTimesMetrics {
  if (!times) return EMPTY_SPRINT_TIMES_METRICS;

  return {
    weeks: times.weeks ?? [],
    rows: times.rows ?? [],
  };
}

export function normalizeSprintStatsScreenData(
  stats: SprintStatsScreenData | null | undefined,
): SprintStatsScreenData | null {
  if (!stats) return null;

  const objectiveItems = stats.goal.objectiveItems ?? stats.goal.riskItems ?? [];

  return {
    ...stats,
    goal: {
      ...stats.goal,
      objectiveItems,
      riskItems: objectiveItems,
    },
    bugs: normalizeSprintBugQualityMetrics(stats.bugs),
    times: normalizeSprintTimesMetrics(stats.times),
    workflow: stats.workflow ?? { pbiProgress: { percent: 0, completedCount: 0, pendingCount: 0, otherCount: 0, totalCount: 0 } },
  };
}
