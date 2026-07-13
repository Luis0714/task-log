import { computeSprintHoursSeries } from "@/lib/dashboard/sprint-hours-series";
import { computeSprintWeekMetrics } from "@/lib/dashboard/sprint-weeks";
import {
  sumHoursBreakdownForDay,
  sumHoursBreakdownForDayKeys,
} from "@/lib/dashboard/hours-breakdown";
import { buildSprintStatusMapping } from "@/lib/dashboard/sprint-status-mapping";
import { computeSprintStatusOverview } from "@/lib/dashboard/sprint-status-overview";
import {
  computeAssignedStoryPoints,
  computeDevelopedStoryPoints,
  computeDashboardMetrics,
  computeSprintPbiProgress,
  mapToDashboardWorkItems,
  selectInProgressItems,
} from "@/lib/dashboard/work-item-selectors";
import {
  collectWorkItemStates,
  groupWorkItemsByStates,
} from "@/lib/time-log/filter-work-items";
import {
  listSprintWorkingDays,
  resolveEffectiveSprintDayKey,
  type SprintWorkingDay,
} from "@/lib/dashboard/sprint-days";
import type { AdoCatalogSnapshot, DashboardSprintBundle } from "@/lib/ado/types";
import type { DashboardMetrics } from "@/lib/dashboard/types";
import { resolveCurrentSprint } from "@/lib/ado/resolve-current-sprint";
import type { AssignmentSegment } from "@/lib/expected-hours";
import { computeExpectedHours } from "@/lib/expected-hours";
import {
  listWorkingDayKeysBetween,
  type WorkingDayFilterOptions,
} from "@/lib/working-days";

export type BuildDashboardMetricsInput = {
  bundle: DashboardSprintBundle;
  catalog: AdoCatalogSnapshot;
  selectedSprintDayKey: string;
};

export function buildDashboardMetrics({
  bundle,
  catalog,
  selectedSprintDayKey,
}: BuildDashboardMetricsInput): {
  metrics: DashboardMetrics;
  sprintWorkingDays: SprintWorkingDay[];
  assigned: ReturnType<typeof mapToDashboardWorkItems>;
  inProgress: ReturnType<typeof mapToDashboardWorkItems>;
} {
  const currentSprint = resolveCurrentSprint(catalog);
  const workingDayOptions: WorkingDayFilterOptions = {
    nonWorkingDates: new Set(bundle.nonWorkingDates),
  };
  const segments: readonly AssignmentSegment[] = bundle.userAssignmentSegments;
  const assigned = mapToDashboardWorkItems(bundle.workItems);
  const assignedBugs = mapToDashboardWorkItems(bundle.bugs);
  const workItemStates = bundle.backlogStates.map((state) => state.name);

  const pbiStateGroups = (() => {
    const stateOrder =
      workItemStates.length > 0 ? workItemStates : collectWorkItemStates(bundle.workItems);
    return groupWorkItemsByStates(assigned, stateOrder);
  })();

  const sprintWorkingDays = listSprintWorkingDays(
    currentSprint?.startDate,
    currentSprint?.finishDate,
    workingDayOptions,
  );

  const userStoryMapping = buildSprintStatusMapping(bundle.backlogStates);
  const bugMapping = buildSprintStatusMapping(bundle.bugStates ?? bundle.backlogStates);

  const pbiProgress = computeSprintPbiProgress(assigned, userStoryMapping);
  const storyPointsAssigned = computeAssignedStoryPoints(assigned);
  const storyPointsDeveloped = computeDevelopedStoryPoints(assigned, userStoryMapping);
  const sprintStatusOverview = computeSprintStatusOverview(assigned, assignedBugs, {
    userStories: userStoryMapping,
    bugs: bugMapping,
  });

  const hoursDayKey = resolveEffectiveSprintDayKey(
    selectedSprintDayKey,
    sprintWorkingDays,
  );
  const sprintEndKey = sprintWorkingDays.at(-1)?.value ?? "";

  const hoursToday = sumHoursBreakdownForDay(bundle.tasks, bundle.bugs, hoursDayKey);
  const hoursSprintTarget = computeSprintExpectedHours(
    currentSprint?.startDate ?? null,
    currentSprint?.finishDate ?? null,
    workingDayOptions,
    segments,
  );
  const allSprintDayKeys = sprintWorkingDays.map((d) => d.value);
  const hoursSprintCurrent =
    allSprintDayKeys.length > 0
      ? sumHoursBreakdownForDayKeys(bundle.tasks, bundle.bugs, allSprintDayKeys, sprintEndKey)
      : { taskHours: 0, bugHours: 0 };
  const hoursByDay = computeSprintHoursSeries(
    sprintWorkingDays,
    bundle.tasks,
    bundle.bugs,
    segments,
  );
  const sprintWeeks = computeSprintWeekMetrics(
    sprintWorkingDays,
    bundle.tasks,
    bundle.bugs,
    segments,
  );

  const metrics = computeDashboardMetrics(hoursToday, {
    sprintHours: { hoursSprintCurrent, hoursSprintTarget },
    storyPointsAssigned,
    storyPointsDeveloped,
    pbiStateGroups,
    pbiProgress,
    sprintStatusOverview,
    sprintWorkingDaysCount: sprintWorkingDays.length,
    hoursByDay,
    sprintWeeks,
  });

  const inProgress = selectInProgressItems(assigned, userStoryMapping);

  return { metrics, sprintWorkingDays, assigned, inProgress };
}

function computeSprintExpectedHours(
  startDate: string | null,
  finishDate: string | null,
  options: WorkingDayFilterOptions,
  segments: readonly AssignmentSegment[],
): number {
  if (!startDate?.trim() || !finishDate?.trim()) return 0;
  const dayKeys = listWorkingDayKeysBetween(startDate, finishDate, options);
  if (dayKeys.length === 0) return 0;
  return computeExpectedHours(dayKeys, segments).expectedHours;
}