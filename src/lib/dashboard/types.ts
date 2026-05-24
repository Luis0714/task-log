import type { AdoWorkItemOptionDto } from "@/lib/schemas/ado-catalog";
import type { WorkItemsByStateGroup } from "@/lib/time-log/filter-work-items";

export type DashboardWorkItem = AdoWorkItemOptionDto & {
  priority?: number | string;
  loggedHours?: number;
  estimatedHours?: number;
};

export type DashboardPbiStateGroup = WorkItemsByStateGroup;

export type DashboardMetrics = {
  hoursToday: number;
  hoursSprintCurrent: number;
  hoursSprintTarget: number;
  hoursRemaining: number;
  pbiStateGroups: DashboardPbiStateGroup[];
};

export type DashboardHeaderData = {
  displayName: string;
  initials: string;
  avatarUrl?: string | null;
  project: string;
  sprintName: string;
};

export type { DashboardActivityItem } from "@/lib/dashboard/activity";
