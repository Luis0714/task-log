import { computeSprintHoursSeries } from "@/lib/dashboard/sprint-hours-series";
import { computeSprintWeekMetrics, formatSprintWeekDateRange } from "@/lib/dashboard/sprint-weeks";
import { computeHoursBreakdown } from "@/lib/hours/aggregate-hours";
import { buildSprintStatusMapping } from "@/lib/dashboard/sprint-status-mapping";
import { computeSprintStatusOverview } from "@/lib/dashboard/sprint-status-overview";
import {
  computeAssignedStoryPoints,
  computeDevelopedStoryPoints,
  computeDashboardMetrics,
  computeSprintPbiProgress,
  mapToDashboardWorkItems,
} from "@/lib/dashboard/work-item-selectors";
import {
  collectWorkItemStates,
  groupWorkItemsByStates,
} from "@/lib/time-log/filter-work-items";
import {
  listSprintCalendarDays,
  listSprintWorkingDays,
  resolveEffectiveSprintDayKey,
  type SprintWorkingDay,
} from "@/lib/dashboard/sprint-days";
import type { AdoCatalogSnapshot, DashboardSprintBundle } from "@/lib/ado/types";
import type { DashboardMetrics } from "@/lib/dashboard/types";
import { resolveCurrentSprint } from "@/lib/ado/resolve-current-sprint";
import type { AssignmentSegment } from "@/lib/expected-hours";
import {
  computeExpectedHours,
  expectedHoursForDay,
  resolveAssignmentPct,
} from "@/lib/expected-hours";
import { type WorkingDayFilterOptions } from "@/lib/working-days";

export type BuildDashboardMetricsInput = {
  bundle: DashboardSprintBundle;
  catalog: AdoCatalogSnapshot;
  selectedSprintDayKey: string;
};

export type BuildDashboardMetricsResult = {
  metrics: DashboardMetrics;
  sprintWorkingDays: SprintWorkingDay[];
  effectiveSprintDayKey: string;
};

export function buildDashboardMetrics({
  bundle,
  catalog,
  selectedSprintDayKey,
}: BuildDashboardMetricsInput): BuildDashboardMetricsResult {
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
  const sprintCalendarDays = listSprintCalendarDays(
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

  const hoursToday = computeHoursBreakdown({
    tasks: bundle.tasks,
    bugs: bundle.bugs,
    workingDayKeys: new Set([hoursDayKey]),
  });
  const allSprintDayKeys = sprintWorkingDays.map((d) => d.value);
  const hoursSprintTarget =
    allSprintDayKeys.length > 0
      ? computeExpectedHours(allSprintDayKeys, segments).expectedHours
      : 0;
  const hoursSprintCurrent = computeHoursBreakdown({
    tasks: bundle.tasks,
    bugs: bundle.bugs,
    workingDayKeys: new Set(allSprintDayKeys),
  });
  const hoursByDay = computeSprintHoursSeries(
    sprintCalendarDays,
    bundle.tasks,
    bundle.bugs,
    segments,
    workingDayOptions,
  );
  const sprintWeeks = computeSprintWeekMetrics(
    sprintWorkingDays,
    bundle.tasks,
    bundle.bugs,
    segments,
  );

  const hoursDayAssignmentPct = hoursDayKey
    ? resolveAssignmentPct(hoursDayKey, segments)
    : undefined;
  const hoursDayTarget = hoursDayKey
    ? expectedHoursForDay(hoursDayKey, segments)
    : undefined;

  const metrics = computeDashboardMetrics(hoursToday, {
    sprintHours: { hoursSprintCurrent, hoursSprintTarget },
    storyPointsAssigned,
    storyPointsDeveloped,
    pbiStateGroups,
    pbiProgress,
    sprintStatusOverview,
    sprintWorkingDaysCount: sprintWorkingDays.length,
    sprintDateRangeLabel: formatSprintWeekDateRange(sprintWorkingDays),
    hoursByDay,
    sprintWeeks,
    hoursDayTarget,
    hoursDayAssignmentPct,
  });

  return {
    metrics,
    sprintWorkingDays,
    effectiveSprintDayKey: hoursDayKey,
  };
}