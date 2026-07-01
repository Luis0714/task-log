import type { HoursBreakdown } from "@/lib/dashboard/hours-breakdown";
import type {
  SprintPbiProgress,
  SprintStatusOverview,
  WorkItemStatusCounts,
} from "@/lib/dashboard/types";
import type { PbiStateBar } from "@/lib/dashboard/pbi-state-chart-data";
import type { SprintSnapshotOperationalMetrics } from "@/lib/sprints/sprint-snapshot-types";
import type {
  SprintBugAssigneeRow,
  SprintBugDetailItem,
  SprintBugQualityMetrics,
  SprintTimesMetrics,
  SprintTimesPersonRow,
  SprintTimesWeekColumn,
} from "@/lib/sprints/sprint-stats-types";
import { EMPTY_SPRINT_TIMES_METRICS } from "@/lib/sprints/build-sprint-times-metrics";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseStatusCounts(value: unknown): WorkItemStatusCounts {
  const row = isRecord(value) ? value : {};
  return {
    assigned: Number(row.assigned ?? 0),
    pending: Number(row.pending ?? 0),
    inProgress: Number(row.inProgress ?? 0),
    completed: Number(row.completed ?? 0),
  };
}

function parseSprintStatusOverview(value: unknown): SprintStatusOverview {
  const row = isRecord(value) ? value : {};
  return {
    userStories: parseStatusCounts(row.userStories),
    bugs: parseStatusCounts(row.bugs),
  };
}

function parsePbiStateBar(value: unknown): PbiStateBar | null {
  if (!isRecord(value)) return null;
  const state = typeof value.state === "string" ? value.state : "";
  const count = Number(value.count ?? 0);
  if (!state || count <= 0) return null;
  return { state, count, items: [] };
}

function parseBugAssigneeRow(value: unknown): SprintBugAssigneeRow | null {
  if (!isRecord(value)) return null;
  const assignee = typeof value.assignee === "string" ? value.assignee : "";
  if (!assignee) return null;
  const imageUrl =
    typeof value.imageUrl === "string" && value.imageUrl.trim()
      ? value.imageUrl
      : undefined;
  return {
    assignee,
    imageUrl,
    total: Number(value.total ?? 0),
    open: Number(value.open ?? 0),
    attended: Number(value.attended ?? 0),
  };
}

function parseBugDetailItem(value: unknown): SprintBugDetailItem | null {
  if (!isRecord(value)) return null;
  const workItemId = Number(value.workItemId ?? 0);
  const title = typeof value.title === "string" ? value.title : "";
  if (workItemId <= 0 || !title) return null;

  return {
    workItemId,
    title,
    assignedTo: typeof value.assignedTo === "string" ? value.assignedTo : null,
    state: typeof value.state === "string" ? value.state : "Sin estado",
    isAttended: Boolean(value.isAttended),
    parentId:
      value.parentId === null || value.parentId === undefined
        ? null
        : Number(value.parentId) || null,
    parentTitle: typeof value.parentTitle === "string" ? value.parentTitle : null,
    inGoalScope: Boolean(value.inGoalScope),
  };
}

function parseBugDetailItems(value: unknown): SprintBugDetailItem[] {
  if (!Array.isArray(value)) return [];
  return value
    .map(parseBugDetailItem)
    .filter((item): item is SprintBugDetailItem => item !== null);
}

function parseBugQualityMetrics(value: unknown): SprintBugQualityMetrics | null {
  if (!isRecord(value)) return null;

  const stateBars = Array.isArray(value.stateBars)
    ? value.stateBars.map(parsePbiStateBar).filter((bar): bar is PbiStateBar => bar !== null)
    : [];

  const assigneeRows = Array.isArray(value.assigneeRows)
    ? value.assigneeRows
        .map(parseBugAssigneeRow)
        .filter((row): row is SprintBugAssigneeRow => row !== null)
    : [];

  return {
    total: Number(value.total ?? 0),
    open: Number(value.open ?? 0),
    attended: Number(value.attended ?? 0),
    unassigned: Number(value.unassigned ?? 0),
    attendedPercent: Number(value.attendedPercent ?? 0),
    stateBars,
    assigneeRows,
    goalBugsTotal: Number(value.goalBugsTotal ?? 0),
    goalBugsOpen: Number(value.goalBugsOpen ?? 0),
    goalStoriesWithOpenBugs: Number(value.goalStoriesWithOpenBugs ?? 0),
    items: parseBugDetailItems(value.items),
  };
}

function parsePbiProgress(value: unknown): SprintPbiProgress {
  const row = isRecord(value) ? value : {};
  return {
    percent: Number(row.percent ?? 0),
    completedCount: Number(row.completedCount ?? 0),
    pendingCount: Number(row.pendingCount ?? 0),
    otherCount: Number(row.otherCount ?? 0),
    totalCount: Number(row.totalCount ?? 0),
  };
}

function parseWorkflowMetrics(value: unknown): SprintSnapshotOperationalMetrics["workflow"] | null {
  if (!isRecord(value)) return null;

  return {
    pbiProgress: parsePbiProgress(value.pbiProgress),
  };
}

function parseHoursBreakdown(value: unknown): HoursBreakdown {
  const row = isRecord(value) ? value : {};
  return {
    taskHours: Number(row.taskHours ?? 0),
    bugHours: Number(row.bugHours ?? 0),
  };
}

function parseSprintTimesWeekColumn(value: unknown): SprintTimesWeekColumn | null {
  if (!isRecord(value)) return null;
  const label = typeof value.label === "string" ? value.label : "";
  if (!label) return null;

  return {
    label,
    dateRangeLabel: typeof value.dateRangeLabel === "string" ? value.dateRangeLabel : "",
    workingDaysCount: Number(value.workingDaysCount ?? 0),
  };
}

function parseSprintTimesPersonRow(value: unknown): SprintTimesPersonRow | null {
  if (!isRecord(value)) return null;
  const assignee = typeof value.assignee === "string" ? value.assignee : "";
  if (!assignee) return null;

  const weeks = Array.isArray(value.weeks)
    ? value.weeks.map(parseHoursBreakdown)
    : [];

  const imageUrl =
    typeof value.imageUrl === "string" && value.imageUrl.trim()
      ? value.imageUrl
      : undefined;

  return {
    assignee,
    imageUrl,
    weeks,
    sprint: parseHoursBreakdown(value.sprint),
  };
}

function parseSprintTimesMetrics(value: unknown): SprintTimesMetrics {
  if (!isRecord(value)) return EMPTY_SPRINT_TIMES_METRICS;

  const weeks = Array.isArray(value.weeks)
    ? value.weeks
        .map(parseSprintTimesWeekColumn)
        .filter((week): week is SprintTimesWeekColumn => week !== null)
    : [];

  const rows = Array.isArray(value.rows)
    ? value.rows
        .map(parseSprintTimesPersonRow)
        .filter((row): row is SprintTimesPersonRow => row !== null)
    : [];

  return { weeks, rows };
}

function parseDeliveryMetrics(value: unknown): SprintSnapshotOperationalMetrics["delivery"] | null {
  if (!isRecord(value)) return null;

  return {
    sprintStatusOverview: parseSprintStatusOverview(value.sprintStatusOverview),
    storyPointsAssigned: Number(value.storyPointsAssigned ?? 0),
    storyPointsDeveloped: Number(value.storyPointsDeveloped ?? 0),
    pbiProgress: parsePbiProgress(value.pbiProgress),
    huStateGroups: [],
    bugStateGroups: [],
  };
}

export function parseSprintStatsPayloadFromApi(
  value: unknown,
): SprintSnapshotOperationalMetrics | null {
  if (!isRecord(value)) return null;

  const delivery = parseDeliveryMetrics(value.delivery);
  const workflow = parseWorkflowMetrics(value.workflow);
  const bugs = parseBugQualityMetrics(value.bugs);
  const times = parseSprintTimesMetrics(value.times);

  if (!delivery || !workflow || !bugs) return null;

  return { delivery, workflow, bugs, times };
}
