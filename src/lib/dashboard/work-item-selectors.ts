import type { AdoWorkItemOptionDto } from "@/lib/schemas/ado-catalog";

import { DEFAULT_SPRINT_HOURS_TARGET } from "@/lib/dashboard/constants";
import { HOURS_PER_WORKING_DAY } from "@/lib/working-days";
import {
  stateMatchesCategory,
  stateMatchesCompletedState,
  type SprintStatusMapping,
} from "@/lib/dashboard/sprint-status-mapping";
import {
  classifyUserStoryWorkflow,
  filterUserStoriesByWorkflowCategory,
} from "@/lib/work-items/user-story-workflow-status";
import { EMPTY_SPRINT_STATUS_OVERVIEW } from "@/lib/dashboard/sprint-status-overview";
import {
  EMPTY_HOURS_BREAKDOWN,
  totalHoursBreakdown,
  type HoursBreakdown,
} from "@/lib/hours/hours-breakdown";
import type {
  DashboardMetrics,
  DashboardWorkItem,
  SprintPbiProgress,
  SprintStatusOverview,
  SprintWeekMetrics,
} from "@/lib/dashboard/types";
import type { SprintDayHoursPoint } from "@/lib/dashboard/sprint-hours-series";
import {
  isCommittedPbiState as isCommittedPbiStateFromLib,
  selectInProgressWorkItems,
  selectUpcomingWorkItems,
} from "@/lib/azure-devops/work-items-filters";

export function isCommittedPbiState(
  state: string,
  mapping: SprintStatusMapping,
): boolean {
  return isCommittedPbiStateFromLib(state, mapping);
}

export function isPendingSprintPbiState(
  state: string,
  mapping: SprintStatusMapping,
): boolean {
  return stateMatchesCategory(state, mapping.pending);
}

export function isWorkedSprintPbiState(
  state: string,
  mapping: SprintStatusMapping,
): boolean {
  return stateMatchesCompletedState(state, mapping);
}

export function computeSprintPbiProgress(
  items: DashboardWorkItem[],
  mapping: SprintStatusMapping,
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
    const category = classifyUserStoryWorkflow(item, mapping);
    if (category === "developed") {
      completedCount += 1;
    } else if (category === "pending") {
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

export function formatStoryPoints(value: number): string {
  if (Number.isInteger(value)) return String(value);
  return value.toFixed(1).replace(/\.0$/, "");
}

function sumStoryPointsEffort(items: readonly DashboardWorkItem[]): number {
  let total = 0;
  for (const item of items) {
    if (item.effort !== undefined && Number.isFinite(item.effort) && item.effort >= 0) {
      total += item.effort;
    }
  }
  return Math.round(total * 10) / 10;
}

export function computeAssignedStoryPoints(items: DashboardWorkItem[]): number {
  return sumStoryPointsEffort(items);
}

/** Suma de story points de HUs en estado desarrollado (workflow). */
export function computeDevelopedStoryPoints(
  items: DashboardWorkItem[],
  mapping: SprintStatusMapping,
): number {
  return sumStoryPointsEffort(
    filterUserStoriesByWorkflowCategory(items, "developed", mapping),
  );
}

export function selectInProgressItems(
  items: DashboardWorkItem[],
  mapping: SprintStatusMapping,
): DashboardWorkItem[] {
  return selectInProgressWorkItems(items, mapping);
}

export function selectUpcomingItems(
  items: DashboardWorkItem[],
  mapping: SprintStatusMapping,
): DashboardWorkItem[] {
  return selectUpcomingWorkItems(items, mapping);
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
  storyPointsAssigned?: number;
  storyPointsDeveloped?: number;
  pbiStateGroups?: DashboardMetrics["pbiStateGroups"];
  pbiProgress?: SprintPbiProgress;
  sprintStatusOverview?: SprintStatusOverview;
  sprintWorkingDaysCount?: number;
  sprintDateRangeLabel?: string;
  hoursByDay?: SprintDayHoursPoint[];
  sprintWeeks?: SprintWeekMetrics[];
  hoursDayTarget?: number;
  hoursDayAssignmentPct?: number;
};

/** Horas pendientes contra una meta: nunca negativas, redondeadas a 0.1. */
function pendingHours(target: number, reported: number): number {
  return Math.max(0, Math.round((target - reported) * 10) / 10);
}

export function computeDashboardMetrics(
  hoursToday: HoursBreakdown,
  input: DashboardMetricsInput = {},
): DashboardMetrics {
  const sprintHours = input.sprintHours ?? DEFAULT_SPRINT_HOURS;
  const hoursSprintCurrent = sprintHours.hoursSprintCurrent ?? EMPTY_HOURS_BREAKDOWN;
  const hoursSprintTarget = Math.round(
    (sprintHours.hoursSprintTarget ?? DEFAULT_SPRINT_HOURS_TARGET) * 10,
  ) / 10;
  const hoursRemaining = pendingHours(
    hoursSprintTarget,
    totalHoursBreakdown(hoursSprintCurrent),
  );
  // Capacidad del día: 8 × %asignación. Si no viene (sin sprint), jornada
  // completa como fallback histórico.
  const hoursDayTarget =
    input.hoursDayTarget !== undefined && input.hoursDayTarget > 0
      ? input.hoursDayTarget
      : HOURS_PER_WORKING_DAY;

  return {
    hoursToday,
    hoursSprintCurrent,
    hoursSprintTarget,
    hoursRemaining,
    hoursDayTarget,
    hoursDayPending: pendingHours(hoursDayTarget, totalHoursBreakdown(hoursToday)),
    hoursDayAssignmentPct: input.hoursDayAssignmentPct ?? 100,
    storyPointsAssigned: input.storyPointsAssigned ?? 0,
    storyPointsDeveloped: input.storyPointsDeveloped ?? 0,
    sprintWorkingDaysCount: input.sprintWorkingDaysCount ?? 0,
    sprintDateRangeLabel: input.sprintDateRangeLabel ?? "",
    hoursByDay: input.hoursByDay ?? [],
    sprintWeeks: input.sprintWeeks ?? [],
    pbiStateGroups: input.pbiStateGroups ?? [],
    pbiProgress: input.pbiProgress ?? EMPTY_PBI_PROGRESS,
    sprintStatusOverview: input.sprintStatusOverview ?? EMPTY_SPRINT_STATUS_OVERVIEW,
  };
}