import type { AdoWorkItemOptionDto } from "@/lib/schemas/ado-catalog";

import { DEFAULT_SPRINT_HOURS_TARGET } from "@/lib/dashboard/constants";
import {
  stateMatchesCategory,
  stateMatchesCompletedState,
  USER_STORY_STATUS_MAPPING,
  type SprintStatusMapping,
} from "@/lib/dashboard/sprint-status-mapping";
import { EMPTY_SPRINT_STATUS_OVERVIEW } from "@/lib/dashboard/sprint-status-overview";
import {
  EMPTY_HOURS_BREAKDOWN,
  totalHoursBreakdown,
  type HoursBreakdown,
} from "@/lib/dashboard/hours-breakdown";
import type {
  DashboardMetrics,
  DashboardWorkItem,
  SprintPbiProgress,
  SprintStatusOverview,
  SprintWeekMetrics,
} from "@/lib/dashboard/types";
import {
  isCommittedPbiState as isCommittedPbiStateFromLib,
  isUpcomingPbiState,
  selectInProgressWorkItems,
  selectUpcomingWorkItems,
} from "@/lib/azure-devops/work-items-filters";

function normalizeState(state: string): string {
  return state.trim().toLowerCase();
}

export function isCommittedPbiState(state: string): boolean {
  return isCommittedPbiStateFromLib(state);
}

export function isUpcomingState(state: string): boolean {
  return isUpcomingPbiState(state);
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

export function isPendingSprintPbiState(
  state: string,
  mapping: SprintStatusMapping = USER_STORY_STATUS_MAPPING,
): boolean {
  return stateMatchesCategory(state, mapping.pending);
}

export function isWorkedSprintPbiState(
  state: string,
  mapping: SprintStatusMapping = USER_STORY_STATUS_MAPPING,
): boolean {
  return stateMatchesCompletedState(state, mapping);
}

export function findQaStartIndexInStateOrder(stateOrder: readonly string[]): number | null {
  const index = stateOrder.findIndex((state) => isQaState(state) || isDoneState(state));
  return index >= 0 ? index : null;
}

export function isSprintPbiCompletedByWorkflow(
  state: string,
  stateOrder: readonly string[],
): boolean {
  const qaStart = findQaStartIndexInStateOrder(stateOrder);
  if (qaStart === null) {
    return isQaState(state) || isDoneState(state);
  }

  const normalized = normalizeState(state);
  const stateIndex = stateOrder.findIndex((candidate) => normalizeState(candidate) === normalized);
  if (stateIndex < 0) {
    return isQaState(state) || isDoneState(state);
  }

  return stateIndex >= qaStart;
}

export function computeSprintPbiProgress(
  items: DashboardWorkItem[],
  _stateOrder: readonly string[] = [],
  mapping: SprintStatusMapping = USER_STORY_STATUS_MAPPING,
): SprintPbiProgress {
  const totalCount = items.length;
  if (totalCount === 0) {
    return {
      percent: 0,
      completedCount: 0,
      pendingCount: 0,
      otherCount: 0,
      totalCount: 0,
    };
  }

  let completedCount = 0;
  let pendingCount = 0;

  for (const item of items) {
    if (isWorkedSprintPbiState(item.state, mapping)) {
      completedCount += 1;
    } else if (isPendingSprintPbiState(item.state, mapping)) {
      pendingCount += 1;
    }
  }

  const otherCount = totalCount - completedCount - pendingCount;
  const percent = Math.round((completedCount / totalCount) * 100);

  return {
    percent,
    completedCount,
    pendingCount,
    otherCount,
    totalCount,
  };
}

export function mapToDashboardWorkItems(items: AdoWorkItemOptionDto[]): DashboardWorkItem[] {
  return items.map((item) => ({ ...item }));
}

export function selectInProgressItems(items: DashboardWorkItem[]): DashboardWorkItem[] {
  return selectInProgressWorkItems(items);
}

export function selectUpcomingItems(items: DashboardWorkItem[]): DashboardWorkItem[] {
  return selectUpcomingWorkItems(items);
}

export type SprintHoursInput = {
  hoursSprintCurrent: HoursBreakdown;
  hoursSprintTarget: number;
};

const DEFAULT_SPRINT_HOURS: SprintHoursInput = {
  hoursSprintCurrent: EMPTY_HOURS_BREAKDOWN,
  hoursSprintTarget: DEFAULT_SPRINT_HOURS_TARGET,
};

const EMPTY_PBI_PROGRESS: SprintPbiProgress = {
  percent: 0,
  completedCount: 0,
  pendingCount: 0,
  otherCount: 0,
  totalCount: 0,
};

export type DashboardMetricsInput = {
  sprintHours?: SprintHoursInput;
  pbiStateGroups?: DashboardMetrics["pbiStateGroups"];
  pbiProgress?: SprintPbiProgress;
  sprintStatusOverview?: SprintStatusOverview;
  sprintWorkingDaysCount?: number;
  sprintWeeks?: SprintWeekMetrics[];
};

export function computeDashboardMetrics(
  hoursToday: HoursBreakdown,
  input: DashboardMetricsInput = {},
): DashboardMetrics {
  const sprintHours = input.sprintHours ?? DEFAULT_SPRINT_HOURS;
  const hoursSprintCurrent = sprintHours.hoursSprintCurrent ?? EMPTY_HOURS_BREAKDOWN;
  const hoursSprintTarget = Math.round(
    (sprintHours.hoursSprintTarget ?? DEFAULT_SPRINT_HOURS_TARGET) * 10,
  ) / 10;
  const hoursRemaining = Math.max(
    0,
    Math.round((hoursSprintTarget - totalHoursBreakdown(hoursSprintCurrent)) * 10) / 10,
  );

  return {
    hoursToday,
    hoursSprintCurrent,
    hoursSprintTarget,
    hoursRemaining,
    sprintWorkingDaysCount: input.sprintWorkingDaysCount ?? 0,
    sprintWeeks: input.sprintWeeks ?? [],
    pbiStateGroups: input.pbiStateGroups ?? [],
    pbiProgress: input.pbiProgress ?? EMPTY_PBI_PROGRESS,
    sprintStatusOverview: input.sprintStatusOverview ?? EMPTY_SPRINT_STATUS_OVERVIEW,
  };
}
