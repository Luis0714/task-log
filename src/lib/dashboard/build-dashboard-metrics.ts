import { computeSprintCapacityHours } from "@/lib/dashboard/sprint-hours";
import { computeSprintHoursSeries } from "@/lib/dashboard/sprint-hours-series";
import { computeSprintWeekMetrics } from "@/lib/dashboard/sprint-weeks";
import {
  sumHoursBreakdownForDay,
  sumHoursBreakdownForDayKeys,
} from "@/lib/dashboard/hours-breakdown";
import {
  BUG_STATUS_MAPPING,
  USER_STORY_STATUS_MAPPING,
} from "@/lib/dashboard/sprint-status-mapping";
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
import { resolveCurrentSprint } from "@/lib/dashboard/resolve-current-sprint";

export { resolveCurrentSprint } from "@/lib/dashboard/resolve-current-sprint";

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
  const workingDayOptions = {
    nonWorkingDates: new Set(bundle.nonWorkingDates),
  };
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

  const pbiProgress = computeSprintPbiProgress(assigned, workItemStates);
  const storyPointsAssigned = computeAssignedStoryPoints(assigned);
  const storyPointsDeveloped = computeDevelopedStoryPoints(assigned);
  const sprintStatusOverview = computeSprintStatusOverview(assigned, assignedBugs, {
    userStories: USER_STORY_STATUS_MAPPING,
    bugs: BUG_STATUS_MAPPING,
  });

  const hoursDayKey = resolveEffectiveSprintDayKey(
    selectedSprintDayKey,
    sprintWorkingDays,
  );
  const sprintEndKey = sprintWorkingDays[sprintWorkingDays.length - 1]?.value ?? "";

  const hoursToday = sumHoursBreakdownForDay(bundle.tasks, bundle.bugs, hoursDayKey);
  const hoursSprintTarget = computeSprintCapacityHours(
    currentSprint?.startDate,
    currentSprint?.finishDate,
    workingDayOptions,
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
  );
  const sprintWeeks = computeSprintWeekMetrics(
    sprintWorkingDays,
    bundle.tasks,
    bundle.bugs,
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

  const inProgress = selectInProgressItems(assigned);

  return { metrics, sprintWorkingDays, assigned, inProgress };
}
