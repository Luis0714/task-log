import type { AdoTaskStateDto, AdoTeamMemberDto, AdoWorkItemOptionDto } from "@/lib/schemas/ado-catalog";
import { buildDashboardDeliveryMetrics } from "@/lib/dashboard/build-dashboard-delivery-metrics";
import { buildSprintWorkflowSectionMetrics } from "@/lib/sprints/build-sprint-workflow-section-metrics";
import { buildBugQualityMetrics, buildParentTitleLookup } from "@/lib/sprints/build-bug-quality-metrics";
import { buildSprintTimesMetrics } from "@/lib/sprints/build-sprint-times-metrics";
import {
  filterBugsToGoalScope,
  filterTasksToGoalScope,
  filterWorkItemsToGoalScope,
  type SprintStatsScope,
} from "@/lib/sprints/filter-sprint-stats-scope";
import type { SprintSnapshotOperationalMetrics } from "@/lib/sprints/sprint-snapshot-types";

export type BuildSprintOperationalMetricsInput = {
  workItems: readonly AdoWorkItemOptionDto[];
  bugs: readonly AdoWorkItemOptionDto[];
  tasks?: readonly AdoWorkItemOptionDto[];
  backlogStates: readonly AdoTaskStateDto[];
  goalWorkItemIds: ReadonlySet<number>;
  scope: SprintStatsScope;
  sprintStartDate?: string | null;
  sprintFinishDate?: string | null;
  nonWorkingDates?: readonly string[];
  assigneeRoster?: readonly AdoTeamMemberDto[];
};

function resolveScopedWorkItems(input: BuildSprintOperationalMetricsInput): AdoWorkItemOptionDto[] {
  if (input.scope === "team") return [...input.workItems];
  return filterWorkItemsToGoalScope(input.workItems, input.goalWorkItemIds);
}

function resolveScopedBugs(input: BuildSprintOperationalMetricsInput): AdoWorkItemOptionDto[] {
  if (input.scope === "team") return [...input.bugs];
  return filterBugsToGoalScope(input.bugs, input.goalWorkItemIds);
}

function resolveScopedTasks(input: BuildSprintOperationalMetricsInput): AdoWorkItemOptionDto[] {
  const tasks = input.tasks ?? [];
  if (input.scope === "team") return [...tasks];
  return filterTasksToGoalScope(tasks, input.goalWorkItemIds);
}

export function buildSprintOperationalMetrics(
  input: BuildSprintOperationalMetricsInput,
): SprintSnapshotOperationalMetrics {
  const workItems = resolveScopedWorkItems(input);
  const bugs = resolveScopedBugs(input);
  const tasks = resolveScopedTasks(input);
  const parentTitlesById = buildParentTitleLookup(input.workItems);

  return {
    delivery: buildDashboardDeliveryMetrics(workItems, bugs),
    workflow: buildSprintWorkflowSectionMetrics(workItems, input.backlogStates),
    bugs: buildBugQualityMetrics({
      bugs,
      goalWorkItemIds: input.goalWorkItemIds,
      parentTitlesById,
      assigneeRoster: input.assigneeRoster,
    }),
    times: buildSprintTimesMetrics({
      tasks,
      bugs,
      sprintStartDate: input.sprintStartDate,
      sprintFinishDate: input.sprintFinishDate,
      nonWorkingDates: input.nonWorkingDates,
      assigneeRoster: input.assigneeRoster,
    }),
  };
}

export type BuildSprintStatsPayloadBundleInput = Omit<
  BuildSprintOperationalMetricsInput,
  "scope"
>;

export function buildSprintStatsPayloadBundle(input: BuildSprintStatsPayloadBundleInput) {
  return {
    team: buildSprintOperationalMetrics({ ...input, scope: "team" }),
    goal: buildSprintOperationalMetrics({ ...input, scope: "goal" }),
  };
}
