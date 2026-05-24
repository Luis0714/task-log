import type { AdoWorkItemOptionDto } from "@/lib/schemas/ado-catalog";
import type { WorkItemsByStateGroup } from "@/lib/time-log/filter-work-items";

export type DashboardWorkItem = AdoWorkItemOptionDto & {
  priority?: number | string;
  loggedHours?: number;
  estimatedHours?: number;
};

export type DashboardPbiStateGroup = WorkItemsByStateGroup;

export type SprintPbiProgress = {
  percent: number;
  completedCount: number;
  pendingCount: number;
  otherCount: number;
  totalCount: number;
};

export type SprintWeekMetrics = {
  label: string;
  hoursCurrent: number;
  hoursTarget: number;
  workingDaysCount: number;
  dateRangeLabel: string;
};

export type DashboardMetrics = {
  hoursToday: number;
  hoursSprintCurrent: number;
  hoursSprintTarget: number;
  hoursRemaining: number;
  sprintWorkingDaysCount: number;
  sprintWeeks: SprintWeekMetrics[];
  pbiStateGroups: DashboardPbiStateGroup[];
  pbiProgress: SprintPbiProgress;
};

export type DashboardHeaderData = {
  displayName: string;
  initials: string;
  avatarUrl?: string | null;
  project: string;
  sprintName: string;
};

export type { DashboardActivityItem } from "@/lib/dashboard/activity";
