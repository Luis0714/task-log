import type { HoursBreakdown } from "@/lib/dashboard/hours-breakdown";
import type { DashboardDeliveryMetrics, SprintPbiProgress } from "@/lib/dashboard/types";
import type { PbiStateBar } from "@/lib/dashboard/pbi-state-chart-data";
import type {
  SprintSnapshotSummary,
  SprintStoryGoalStatus,
} from "@/lib/sprints/sprint-snapshot-types";

export type SprintGoalObjectiveItem = {
  workItemId: number;
  title: string;
  assignedTo: string | null;
  effort: number | null;
  goalStatus: SprintStoryGoalStatus;
  targetStateName: string | null;
  targetTacTagName: string | null;
  finalStateName: string | null;
  finalTacTagName: string | null;
};

/** @deprecated Usa SprintGoalObjectiveItem */
export type SprintGoalRiskItem = SprintGoalObjectiveItem;

export type SprintGoalMetrics = {
  generalObjective: string;
  summary: SprintSnapshotSummary;
  achievementPercent: number;
  storyPointsPercent: number;
  /** Historias comprometidas en el objetivo (cumplida, parcial/en proceso, no cumplida). */
  objectiveItems: SprintGoalObjectiveItem[];
  /** @deprecated Usa objectiveItems */
  riskItems: SprintGoalObjectiveItem[];
  goalWorkItemIds: number[];
};

export type SprintBugAssigneeRow = {
  assignee: string;
  total: number;
  open: number;
  attended: number;
};

export type SprintBugDetailItem = {
  workItemId: number;
  title: string;
  assignedTo: string | null;
  state: string;
  isAttended: boolean;
  parentId: number | null;
  parentTitle: string | null;
  inGoalScope: boolean;
};

export type SprintBugQualityMetrics = {
  total: number;
  open: number;
  attended: number;
  unassigned: number;
  attendedPercent: number;
  stateBars: PbiStateBar[];
  assigneeRows: SprintBugAssigneeRow[];
  goalBugsTotal: number;
  goalBugsOpen: number;
  goalStoriesWithOpenBugs: number;
  items: SprintBugDetailItem[];
};

export type SprintWorkflowSectionMetrics = {
  pbiProgress: SprintPbiProgress;
};

export type SprintTimesWeekColumn = {
  label: string;
  dateRangeLabel: string;
  workingDaysCount: number;
};

export type SprintTimesPersonRow = {
  assignee: string;
  week1: HoursBreakdown;
  week2: HoursBreakdown;
  sprint: HoursBreakdown;
};

export type SprintTimesMetrics = {
  weeks: SprintTimesWeekColumn[];
  rows: SprintTimesPersonRow[];
};

export type SprintStatsScreenData = {
  goal: SprintGoalMetrics;
  delivery: DashboardDeliveryMetrics;
  workflow: SprintWorkflowSectionMetrics;
  bugs: SprintBugQualityMetrics;
  times: SprintTimesMetrics;
};
