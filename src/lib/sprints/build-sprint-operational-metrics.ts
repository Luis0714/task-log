import type { AdoTaskStateDto, AdoTeamMemberDto, AdoWorkItemOptionDto } from "@/lib/schemas/ado-catalog";
import type { AssignmentSegment } from "@/lib/expected-hours";
import { buildSprintStatusMapping } from "@/lib/dashboard/sprint-status-mapping";
import { buildDashboardDeliveryMetrics } from "@/lib/dashboard/build-dashboard-delivery-metrics";
import { buildSprintWorkflowSectionMetrics } from "@/lib/sprints/build-sprint-workflow-section-metrics";
import { buildBugQualityMetrics, buildParentTitleLookup } from "@/lib/sprints/build-bug-quality-metrics";
import type { SprintNewsSolicitud } from "@/lib/sprints/build-sprint-news-hours-by-week";
import { buildSprintTimesMetrics } from "@/lib/sprints/build-sprint-times-metrics";
import {
  filterBugsToGoalScope,
  filterWorkItemsToGoalScope,
  type SprintStatsScope,
} from "@/lib/sprints/filter-sprint-stats-scope";
import type { SprintSnapshotOperationalMetrics } from "@/lib/sprints/sprint-snapshot-types";

export type BuildSprintOperationalMetricsInput = {
  workItems: readonly AdoWorkItemOptionDto[];
  bugs: readonly AdoWorkItemOptionDto[];
  tasks?: readonly AdoWorkItemOptionDto[];
  backlogStates: readonly AdoTaskStateDto[];
  bugStates?: readonly AdoTaskStateDto[];
  goalWorkItemIds: ReadonlySet<number>;
  scope: SprintStatsScope;
  sprintStartDate?: string | null;
  sprintFinishDate?: string | null;
  nonWorkingDates?: readonly string[];
  assigneeRoster?: readonly AdoTeamMemberDto[];
  assignmentSegmentsByAssignee?: ReadonlyMap<string, readonly AssignmentSegment[]>;
  newsSolicitudes?: readonly SprintNewsSolicitud[];
};

function resolveScopedWorkItems(input: BuildSprintOperationalMetricsInput): AdoWorkItemOptionDto[] {
  if (input.scope === "team") return [...input.workItems];
  return filterWorkItemsToGoalScope(input.workItems, input.goalWorkItemIds);
}

function resolveScopedBugs(input: BuildSprintOperationalMetricsInput): AdoWorkItemOptionDto[] {
  if (input.scope === "team") return [...input.bugs];
  return filterBugsToGoalScope(input.bugs, input.goalWorkItemIds);
}


export function buildSprintOperationalMetrics(
  input: BuildSprintOperationalMetricsInput,
): SprintSnapshotOperationalMetrics {
  const workItems = resolveScopedWorkItems(input);
  const bugs = resolveScopedBugs(input);
  const parentTitlesById = buildParentTitleLookup(input.workItems);

  // Sin bugStates del proyecto caemos a los backlogStates (mismo proceso Scrum-like).
  const effectiveBugStates = input.bugStates ?? input.backlogStates;
  const bugMapping = buildSprintStatusMapping(effectiveBugStates);

  return {
    delivery: buildDashboardDeliveryMetrics({
      workItems,
      bugs,
      backlogStates: input.backlogStates,
      bugStates: effectiveBugStates,
    }),
    workflow: buildSprintWorkflowSectionMetrics(workItems, input.backlogStates),
    bugs: buildBugQualityMetrics({
      bugs,
      goalWorkItemIds: input.goalWorkItemIds,
      parentTitlesById,
      assigneeRoster: input.assigneeRoster,
      bugMapping,
    }),
    times: buildSprintTimesMetrics({
      tasks: input.tasks ?? [],
      bugs: input.bugs,
      sprintStartDate: input.sprintStartDate,
      sprintFinishDate: input.sprintFinishDate,
      nonWorkingDates: input.nonWorkingDates,
      assigneeRoster: input.assigneeRoster,
      assignmentSegmentsByAssignee: input.assignmentSegmentsByAssignee,
      newsSolicitudes: input.newsSolicitudes,
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