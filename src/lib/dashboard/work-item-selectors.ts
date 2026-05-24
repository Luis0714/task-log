import type { AdoWorkItemOptionDto } from "@/lib/schemas/ado-catalog";

import { DEFAULT_SPRINT_HOURS_TARGET } from "@/lib/dashboard/constants";
import type { DashboardMetrics, DashboardWorkItem } from "@/lib/dashboard/types";

function normalizeState(state: string): string {
  return state.trim().toLowerCase();
}

const IN_PROGRESS_PBI_STATE = "Committed";

export function isCommittedPbiState(state: string): boolean {
  return normalizeState(state) === normalizeState(IN_PROGRESS_PBI_STATE);
}

export function isUpcomingState(state: string): boolean {
  const normalized = normalizeState(state);
  return ["new", "proposed", "to do", "todo", "pending", "ready"].includes(normalized);
}

export function isQaState(state: string): boolean {
  const normalized = normalizeState(state);
  return (
    normalized.includes("qa") ||
    normalized.includes("test") ||
    normalized.includes("review") ||
    normalized.includes("validat")
  );
}

export function isDoneState(state: string): boolean {
  const normalized = normalizeState(state);
  return ["done", "closed", "completed", "resolved"].includes(normalized);
}

function compareByPriority(a: DashboardWorkItem, b: DashboardWorkItem): number {
  const priorityA = typeof a.priority === "number" ? a.priority : 99;
  const priorityB = typeof b.priority === "number" ? b.priority : 99;
  if (priorityA !== priorityB) return priorityA - priorityB;
  return a.title.localeCompare(b.title, "es");
}

export function mapToDashboardWorkItems(items: AdoWorkItemOptionDto[]): DashboardWorkItem[] {
  return items.map((item) => ({ ...item }));
}

export function selectInProgressItems(items: DashboardWorkItem[]): DashboardWorkItem[] {
  return items.filter((item) => isCommittedPbiState(item.state)).sort(compareByPriority);
}

export function selectUpcomingItems(items: DashboardWorkItem[]): DashboardWorkItem[] {
  return items.filter((item) => isUpcomingState(item.state)).sort(compareByPriority);
}

export function sumDoneTaskLoggedHours(items: DashboardWorkItem[]): number {
  return items.reduce((sum, item) => {
    if (!isDoneState(item.state)) return sum;
    return sum + (item.loggedHours ?? 0);
  }, 0);
}

export type SprintHoursInput = {
  hoursSprintCurrent: number;
  hoursSprintTarget: number;
};

const DEFAULT_SPRINT_HOURS: SprintHoursInput = {
  hoursSprintCurrent: 0,
  hoursSprintTarget: DEFAULT_SPRINT_HOURS_TARGET,
};

export function computeDashboardMetrics(
  hoursToday: number,
  sprintHours: SprintHoursInput = DEFAULT_SPRINT_HOURS,
  pbiStateGroups: DashboardMetrics["pbiStateGroups"] = [],
): DashboardMetrics {
  const hoursSprintCurrent = Math.round((sprintHours?.hoursSprintCurrent ?? 0) * 10) / 10;
  const hoursSprintTarget = Math.round(
    (sprintHours?.hoursSprintTarget ?? DEFAULT_SPRINT_HOURS_TARGET) * 10,
  ) / 10;
  const hoursRemaining = Math.max(
    0,
    Math.round((hoursSprintTarget - hoursSprintCurrent) * 10) / 10,
  );

  return {
    hoursToday,
    hoursSprintCurrent,
    hoursSprintTarget,
    hoursRemaining,
    pbiStateGroups,
  };
}
