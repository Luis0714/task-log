"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { useCopilotHistory } from "@/hooks/use-copilot-history";
import { useAdoContextSelection } from "@/hooks/use-ado-context-selection";
import { useAdoSprintWorkItems } from "@/hooks/use-ado-sprint-work-items";
import {
  buildDailySummary,
  computeHoursFromHistoryForDay,
  computeHoursFromHistoryThroughDay,
  filterHistoryByDay,
  mapHistoryToActivityItems,
} from "@/lib/dashboard/activity";
import {
  computeSprintCapacityHours,
  computeSprintCapacityHoursThroughDay,
} from "@/lib/dashboard/sprint-hours";
import { computeSprintWeekMetrics } from "@/lib/dashboard/sprint-weeks";
import {
  formatSprintDayShortLabel,
  isSameLocalDay,
  listSprintWorkingDays,
  parseLocalDateKey,
  pickDefaultSprintDayKey,
  toLocalDateKey,
  type SprintWorkingDay,
} from "@/lib/dashboard/sprint-days";
import {
  computeDashboardMetrics,
  computeSprintPbiProgress,
  mapToDashboardWorkItems,
  selectInProgressItems,
  selectUpcomingItems,
  sumDoneTaskLoggedHours,
} from "@/lib/dashboard/work-item-selectors";
import { useAdoBacklogStates } from "@/hooks/use-ado-backlog-states";
import { useAdoSprintTasks } from "@/hooks/use-ado-sprint-tasks";
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

  const { project, sprintPath } = context;

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
      listSprintWorkingDays(currentSprint?.startDate, currentSprint?.finishDate),
    [currentSprint?.finishDate, currentSprint?.startDate],
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

  const dayHistory = useMemo(() => {
    if (!selectedSprintDayKey) return history;
    return filterHistoryByDay(history, selectedSprintDayKey);
  }, [history, selectedSprintDayKey]);

  const hoursToday = useMemo(() => {
    const dayKey = selectedSprintDayKey || toLocalDateKey(new Date());
    return computeHoursFromHistoryForDay(history, dayKey);
  }, [history, selectedSprintDayKey]);

  const pbiProgress = useMemo(
    () => computeSprintPbiProgress(assigned, workItemStates),
    [assigned, workItemStates],
  );

  const metrics: DashboardMetrics = useMemo(() => {
    const dayKey = selectedSprintDayKey;
    const hoursSprintTarget = dayKey
      ? computeSprintCapacityHoursThroughDay(
          currentSprint?.startDate,
          dayKey,
          currentSprint?.finishDate,
        )
      : computeSprintCapacityHours(currentSprint?.startDate, currentSprint?.finishDate);

    const hoursFromHistory = dayKey
      ? computeHoursFromHistoryThroughDay(history, dayKey)
      : computeHoursFromHistoryThroughDay(history, toLocalDateKey(new Date()));
    const hoursFromAdo = sumDoneTaskLoggedHours(mapToDashboardWorkItems(sprintTasks));
    const selectedDate = dayKey ? parseLocalDateKey(dayKey) : null;
    const viewingToday = selectedDate ? isSameLocalDay(selectedDate, new Date()) : true;
    const hoursSprintCurrent =
      viewingToday && hoursFromAdo > hoursFromHistory ? hoursFromAdo : hoursFromHistory;

    const sprintWeeks = selectedSprintDayKey
      ? computeSprintWeekMetrics(sprintWorkingDays, history, selectedSprintDayKey)
      : [];

    return computeDashboardMetrics(hoursToday, {
      sprintHours: { hoursSprintCurrent, hoursSprintTarget },
      pbiStateGroups,
      pbiProgress,
      sprintWorkingDaysCount: sprintWorkingDays.length,
      sprintWeeks,
    });
  }, [
    currentSprint?.finishDate,
    currentSprint?.startDate,
    hoursToday,
    history,
    pbiProgress,
    pbiStateGroups,
    selectedSprintDayKey,
    sprintTasks,
    sprintWorkingDays,
  ]);

  const hoursDayLabel = useMemo(() => {
    if (!selectedSprintDay) return "Horas del día";
    if (isSameLocalDay(selectedSprintDay.date, new Date())) return "Horas hoy";
    return `Horas ${formatSprintDayShortLabel(selectedSprintDay)}`;
  }, [selectedSprintDay]);

  const dailySummary = useMemo(
    () => buildDailySummary(inProgress, dayHistory),
    [dayHistory, inProgress],
  );

  const activity = useMemo(() => mapHistoryToActivityItems(dayHistory), [dayHistory]);

  const regenerateDailySummary = useCallback(
    () => buildDailySummary(inProgress, dayHistory),
    [dayHistory, inProgress],
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
    (contextLoading || workItemsLoading || tasksLoading);

  const error =
    context.projectsError ??
    context.teamsError ??
    context.sprintsError ??
    workItemsError ??
    tasksError ??
    null;

  return {
    header: resolvedHeader,
    metrics,
    hoursDayLabel,
    dailySummary,
    activity,
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
