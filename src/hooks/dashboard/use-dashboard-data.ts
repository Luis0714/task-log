"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { useCopilotHistory } from "@/hooks/use-copilot-history";
import { useAdoContextSelection } from "@/hooks/use-ado-context-selection";
import { useAdoSprintWorkItems } from "@/hooks/use-ado-sprint-work-items";
import { buildDailySummary } from "@/lib/dashboard/activity";
import { computeSprintCapacityHours } from "@/lib/dashboard/sprint-hours";
import { computeSprintHoursSeries } from "@/lib/dashboard/sprint-hours-series";
import { computeSprintWeekMetrics } from "@/lib/dashboard/sprint-weeks";
import {
  formatSprintDayShortLabel,
  isSameLocalDay,
  listSprintWorkingDays,
  pickDefaultSprintDayKey,
  toLocalDateKey,
  type SprintWorkingDay,
} from "@/lib/dashboard/sprint-days";
import {
  sumHoursBreakdownForDay,
  sumHoursBreakdownThroughDay,
} from "@/lib/dashboard/hours-breakdown";
import {
  BUG_STATUS_MAPPING,
  USER_STORY_STATUS_MAPPING,
} from "@/lib/dashboard/sprint-status-mapping";
import { computeSprintStatusOverview } from "@/lib/dashboard/sprint-status-overview";
import {
  computeAssignedStoryPoints,
  computeDashboardMetrics,
  computeSprintPbiProgress,
  mapToDashboardWorkItems,
  selectInProgressItems,
  selectUpcomingItems,
} from "@/lib/dashboard/work-item-selectors";
import { useAdoBacklogStates } from "@/hooks/use-ado-backlog-states";
import { useAdoSprintBugs } from "@/hooks/use-ado-sprint-bugs";
import { useAdoSprintTasks } from "@/hooks/use-ado-sprint-tasks";
import { useAdoTeamDaysOff } from "@/hooks/use-ado-team-days-off";
import type { DashboardHeaderData, DashboardMetrics } from "@/lib/dashboard/types";
import {
  collectWorkItemStates,
  groupWorkItemsByStates,
} from "@/lib/time-log/filter-work-items";
import { WORK_ITEM_ASSIGNEE_ME } from "@/lib/schemas/work-item-filters";

export type UseDashboardDataOptions = {
  adoExecutionReady: boolean;
  defaultProject: string | null;
  header: DashboardHeaderData;
};

export function useDashboardData({
  adoExecutionReady,
  defaultProject,
  header,
}: UseDashboardDataOptions) {
  const { history } = useCopilotHistory();
  const context = useAdoContextSelection({
    adoExecutionReady,
    defaultProject,
  });

  const { project, sprintPath, team } = context;

  const { nonWorkingDates, loading: daysOffLoading } = useAdoTeamDaysOff(
    project || undefined,
    team || undefined,
    adoExecutionReady,
  );

  const workingDayOptions = useMemo(
    () => ({ nonWorkingDates }),
    [nonWorkingDates],
  );

  const { states: backlogStates } = useAdoBacklogStates(
    project || undefined,
    adoExecutionReady,
  );

  const {
    workItems,
    loading: workItemsLoading,
    error: workItemsError,
  } = useAdoSprintWorkItems(
    project || undefined,
    sprintPath || undefined,
    WORK_ITEM_ASSIGNEE_ME,
    adoExecutionReady,
  );

  const {
    bugs: sprintBugs,
    loading: bugsLoading,
    error: bugsError,
  } = useAdoSprintBugs(
    project || undefined,
    sprintPath || undefined,
    WORK_ITEM_ASSIGNEE_ME,
    adoExecutionReady,
  );

  const {
    tasks: sprintTasks,
    loading: tasksLoading,
    error: tasksError,
  } = useAdoSprintTasks(
    project || undefined,
    sprintPath || undefined,
    WORK_ITEM_ASSIGNEE_ME,
    adoExecutionReady,
  );

  const assigned = useMemo(() => mapToDashboardWorkItems(workItems), [workItems]);
  const assignedBugs = useMemo(() => mapToDashboardWorkItems(sprintBugs), [sprintBugs]);
  const inProgress = useMemo(() => selectInProgressItems(assigned), [assigned]);
  const upcoming = useMemo(() => selectUpcomingItems(assigned), [assigned]);

  const workItemStates = useMemo(
    () => backlogStates.map((state) => state.name),
    [backlogStates],
  );

  const pbiStateGroups = useMemo(() => {
    const stateOrder =
      workItemStates.length > 0 ? workItemStates : collectWorkItemStates(workItems);
    return groupWorkItemsByStates(assigned, stateOrder);
  }, [assigned, workItemStates, workItems]);

  const currentSprint = useMemo(
    () => context.sprints.find((sprint) => sprint.path === sprintPath) ?? null,
    [context.sprints, sprintPath],
  );

  const sprintWorkingDays = useMemo(
    () =>
      listSprintWorkingDays(
        currentSprint?.startDate,
        currentSprint?.finishDate,
        workingDayOptions,
      ),
    [currentSprint?.finishDate, currentSprint?.startDate, workingDayOptions],
  );

  const [selectedSprintDayKey, setSelectedSprintDayKey] = useState("");

  useEffect(() => {
    const defaultKey = pickDefaultSprintDayKey(sprintWorkingDays);
    if (!defaultKey) {
      setSelectedSprintDayKey("");
      return;
    }
    setSelectedSprintDayKey((current) => {
      const stillValid = sprintWorkingDays.some((day) => day.value === current);
      return stillValid ? current : defaultKey;
    });
  }, [sprintPath, sprintWorkingDays]);

  const selectedSprintDay = useMemo(
    () => sprintWorkingDays.find((day) => day.value === selectedSprintDayKey) ?? null,
    [selectedSprintDayKey, sprintWorkingDays],
  );

  const pbiProgress = useMemo(
    () => computeSprintPbiProgress(assigned, workItemStates),
    [assigned, workItemStates],
  );

  const storyPointsAssigned = useMemo(
    () => computeAssignedStoryPoints(assigned),
    [assigned],
  );

  const sprintStatusOverview = useMemo(
    () =>
      computeSprintStatusOverview(assigned, assignedBugs, {
        userStories: USER_STORY_STATUS_MAPPING,
        bugs: BUG_STATUS_MAPPING,
      }),
    [assigned, assignedBugs],
  );

  const metrics: DashboardMetrics = useMemo(() => {
    const todayKey = toLocalDateKey(new Date());
    const hoursDayKey = selectedSprintDayKey || todayKey;
    const sprintEndKey =
      sprintWorkingDays[sprintWorkingDays.length - 1]?.value ?? "";

    const hoursToday = sumHoursBreakdownForDay(sprintTasks, sprintBugs, hoursDayKey);

    const hoursSprintTarget = computeSprintCapacityHours(
      currentSprint?.startDate,
      currentSprint?.finishDate,
      workingDayOptions,
    );
    const hoursSprintCurrent =
      sprintEndKey !== ""
        ? sumHoursBreakdownThroughDay(sprintTasks, sprintBugs, sprintEndKey)
        : { taskHours: 0, bugHours: 0 };
    const hoursByDay =
      sprintEndKey !== ""
        ? computeSprintHoursSeries(
            sprintWorkingDays,
            sprintTasks,
            sprintBugs,
            sprintEndKey,
          )
        : [];
    const sprintWeeks = computeSprintWeekMetrics(
      sprintWorkingDays,
      sprintTasks,
      sprintBugs,
    );

    return computeDashboardMetrics(hoursToday, {
      sprintHours: { hoursSprintCurrent, hoursSprintTarget },
      storyPointsAssigned,
      pbiStateGroups,
      pbiProgress,
      sprintStatusOverview,
      sprintWorkingDaysCount: sprintWorkingDays.length,
      hoursByDay,
      sprintWeeks,
    });
  }, [
    currentSprint?.finishDate,
    currentSprint?.startDate,
    workingDayOptions,
    pbiProgress,
    pbiStateGroups,
    selectedSprintDayKey,
    sprintStatusOverview,
    sprintBugs,
    sprintTasks,
    sprintWorkingDays,
    storyPointsAssigned,
  ]);

  const hoursDayLabel = useMemo(() => {
    if (!selectedSprintDay) return "Horas del día";
    if (isSameLocalDay(selectedSprintDay.date, new Date())) return "Horas hoy";
    return `Horas ${formatSprintDayShortLabel(selectedSprintDay)}`;
  }, [selectedSprintDay]);

  const dailySummary = useMemo(
    () => buildDailySummary(inProgress, history),
    [history, inProgress],
  );

  const regenerateDailySummary = useCallback(
    () => buildDailySummary(inProgress, history),
    [history, inProgress],
  );

  const resolvedHeader: DashboardHeaderData = useMemo(
    () => ({
      ...header,
      project: project || header.project,
      sprintName: currentSprint?.name ?? header.sprintName,
    }),
    [currentSprint?.name, header, project],
  );

  const { contextLoading, ...contextFields } = context;

  const loading =
    adoExecutionReady &&
    (contextLoading || daysOffLoading || workItemsLoading || bugsLoading || tasksLoading);

  const error =
    context.projectsError ??
    context.teamsError ??
    context.sprintsError ??
    workItemsError ??
    bugsError ??
    tasksError ??
    null;

  return {
    header: resolvedHeader,
    metrics,
    hoursDayLabel,
    dailySummary,
    regenerateDailySummary,
    loading,
    error,
    adoExecutionReady,
    context: contextFields,
    sprintDay: {
      value: selectedSprintDayKey,
      workingDays: sprintWorkingDays,
      selectedDay: selectedSprintDay,
      onValueChange: setSelectedSprintDayKey,
    } satisfies {
      value: string;
      workingDays: SprintWorkingDay[];
      selectedDay: SprintWorkingDay | null;
      onValueChange: (value: string) => void;
    },
  };
}
