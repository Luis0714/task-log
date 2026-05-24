"use client";

import { useCallback, useMemo } from "react";

import { useCopilotHistory } from "@/hooks/use-copilot-history";
import { useAdoProjects } from "@/hooks/use-ado-projects";
import { useAdoSprintWorkItems } from "@/hooks/use-ado-sprint-work-items";
import { useAdoSprints } from "@/hooks/use-ado-sprints";
import { useAdoTeams } from "@/hooks/use-ado-teams";
import {
  buildDailySummary,
  computeHoursTodayFromHistory,
  mapHistoryToActivityItems,
} from "@/lib/dashboard/activity";
import { computeSprintCapacityHours } from "@/lib/dashboard/sprint-hours";
import {
  computeDashboardMetrics,
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
import {
  resolvePreferredProject,
  resolvePreferredSprint,
  resolvePreferredTeam,
} from "@/lib/time-log/form-selection";
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

  const {
    projects,
    defaultProject: serverDefaultProject,
    loading: projectsLoading,
    error: projectsError,
  } = useAdoProjects(adoExecutionReady);

  const suggestedProject = useMemo(() => {
    if (!adoExecutionReady || projectsLoading || projects.length === 0) return "";
    return resolvePreferredProject(projects, defaultProject ?? serverDefaultProject) ?? "";
  }, [
    adoExecutionReady,
    defaultProject,
    projects,
    projectsLoading,
    serverDefaultProject,
  ]);

  const project = suggestedProject;

  const {
    teams,
    defaultTeam,
    suggestedTeam: apiSuggestedTeam,
    loading: teamsLoading,
    error: teamsError,
  } = useAdoTeams(project || undefined, adoExecutionReady);

  const suggestedTeam = useMemo(() => {
    if (!project || teamsLoading || teams.length === 0) return "";
    return resolvePreferredTeam(teams, defaultTeam, apiSuggestedTeam) ?? "";
  }, [project, teams, teamsLoading, defaultTeam, apiSuggestedTeam]);

  const team = project ? suggestedTeam : "";

  const {
    sprints,
    loading: sprintsLoading,
    error: sprintsError,
  } = useAdoSprints(project || undefined, team || undefined, adoExecutionReady);

  const suggestedSprintPath = useMemo(() => {
    if (!team || sprintsLoading || sprints.length === 0) return "";
    return resolvePreferredSprint(sprints) ?? "";
  }, [team, sprints, sprintsLoading]);

  const sprintPath = team ? suggestedSprintPath : "";

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

  const hoursToday = useMemo(() => computeHoursTodayFromHistory(history), [history]);

  const currentSprint = useMemo(
    () => sprints.find((sprint) => sprint.path === sprintPath) ?? null,
    [sprintPath, sprints],
  );

  const metrics: DashboardMetrics = useMemo(() => {
    const hoursSprintTarget = computeSprintCapacityHours(
      currentSprint?.startDate,
      currentSprint?.finishDate,
    );
    const hoursSprintCurrent = sumDoneTaskLoggedHours(mapToDashboardWorkItems(sprintTasks));
    return computeDashboardMetrics(
      hoursToday,
      { hoursSprintCurrent, hoursSprintTarget },
      pbiStateGroups,
    );
  }, [
    hoursToday,
    currentSprint?.finishDate,
    currentSprint?.startDate,
    pbiStateGroups,
    sprintTasks,
  ]);

  const dailySummary = useMemo(
    () => buildDailySummary(inProgress, history),
    [inProgress, history],
  );

  const activity = useMemo(() => mapHistoryToActivityItems(history), [history]);

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

  const loading =
    adoExecutionReady &&
    (projectsLoading || teamsLoading || sprintsLoading || workItemsLoading || tasksLoading);

  const error =
    projectsError ?? teamsError ?? sprintsError ?? workItemsError ?? tasksError ?? null;

  return {
    header: resolvedHeader,
    metrics,
    inProgress,
    upcoming,
    assigned,
    dailySummary,
    activity,
    regenerateDailySummary,
    loading,
    error,
    adoExecutionReady,
  };
}
