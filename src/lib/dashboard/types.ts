import type { AdoWorkItemOptionDto } from "@/lib/schemas/ado-catalog";

export type DashboardWorkItem = AdoWorkItemOptionDto & {
  priority?: number | string;
  loggedHours?: number;
  estimatedHours?: number;
};

export type DashboardStatusCount = {
  label: string;
  count: number;
};

export type DashboardMetrics = {
  hoursToday: number;
  hoursSprintCurrent: number;
  hoursSprintTarget: number;
  hoursRemaining: number;
  pbiStatusCounts: DashboardStatusCount[];
};

export type DashboardHeaderData = {
  displayName: string;
  initials: string;
  avatarUrl?: string | null;
  project: string;
  sprintName: string;
};
