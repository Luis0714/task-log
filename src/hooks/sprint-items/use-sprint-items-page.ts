"use client";

import { useEffect, useMemo, useState } from "react";

import { useAdoBugStates } from "@/hooks/use-ado-bug-states";
import { useAdoContextSelection } from "@/hooks/use-ado-context-selection";
import { useAdoSprintBugs } from "@/hooks/use-ado-sprint-bugs";
import { useAdoSprintTasks } from "@/hooks/use-ado-sprint-tasks";
import { useAdoTaskStates } from "@/hooks/use-ado-task-states";
import { useAdoTeamDaysOff } from "@/hooks/use-ado-team-days-off";
import { useAdoTeamMembers } from "@/hooks/use-ado-team-members";
import { useWorkItemFilters } from "@/hooks/use-work-item-filters";
import { collectWorkItemStates } from "@/lib/azure-devops/work-items-filters";
import {
  listSprintWorkingDays,
  pickDefaultSprintDayKey,
  type SprintWorkingDay,
} from "@/lib/dashboard/sprint-days";
import {
  WORK_ITEM_ASSIGNEE_ME,
  isWorkItemAssigneeAll,
  isWorkItemAssigneeMe,
} from "@/lib/schemas/work-item-filters";
import {
  SPRINT_DAY_ALL,
  filterSprintItemsByCriteria,
  sortItemsByWorkingDateAsc,
} from "@/lib/sprint-items/filter-by-criteria";

export type SprintItemsKind = "tasks" | "bugs";

export type UseSprintItemsPageOptions = {
  kind: SprintItemsKind;
  adoExecutionReady: boolean;
  defaultProject: string | null;
};

export function useSprintItemsPage({
  kind,
  adoExecutionReady,
  defaultProject,
}: UseSprintItemsPageOptions) {
  const {
    filters,
    setSearch,
    setAssignee,
    setState,
    resetFilters,
  } = useWorkItemFilters();

  const context = useAdoContextSelection({
    adoExecutionReady,
    defaultProject,
  });

  const { project, team, sprintPath } = context;

  const { nonWorkingDates, loading: daysOffLoading } = useAdoTeamDaysOff(
    project || undefined,
    team || undefined,
    adoExecutionReady,
  );

  const workingDayOptions = useMemo(
    () => ({ nonWorkingDates }),
    [nonWorkingDates],
  );

  const {
    members: teamMembers,
    loading: teamMembersLoading,
    error: teamMembersError,
  } = useAdoTeamMembers(project || undefined, team || undefined, adoExecutionReady);

  const {
    states: taskStatesFromApi,
    loading: taskStatesLoading,
    error: taskStatesError,
  } = useAdoTaskStates(project || undefined, adoExecutionReady && kind === "tasks");

  const {
    states: bugStatesFromApi,
    loading: bugStatesLoading,
    error: bugStatesError,
  } = useAdoBugStates(project || undefined, adoExecutionReady && kind === "bugs");

  const {
    tasks: sprintTasks,
    loading: tasksLoading,
    error: tasksError,
    refetch: refetchTasks,
  } = useAdoSprintTasks(
    project || undefined,
    sprintPath || undefined,
    filters.assignee,
    adoExecutionReady && kind === "tasks",
  );

  const {
    bugs: sprintBugs,
    loading: bugsLoading,
    error: bugsError,
    refetch: refetchBugs,
  } = useAdoSprintBugs(
    project || undefined,
    sprintPath || undefined,
    filters.assignee,
    adoExecutionReady && kind === "bugs",
  );

  const sprintItems = kind === "tasks" ? sprintTasks : sprintBugs;
  const itemsLoading = kind === "tasks" ? tasksLoading : bugsLoading;
  const itemsError = kind === "tasks" ? tasksError : bugsError;
  const statesLoading = kind === "tasks" ? taskStatesLoading : bugStatesLoading;
  const statesError = kind === "tasks" ? taskStatesError : bugStatesError;

  const stateNames = useMemo(() => {
    if (kind === "tasks" && taskStatesFromApi.length > 0) {
      return taskStatesFromApi.map((state) => state.name);
    }
    if (kind === "bugs" && bugStatesFromApi.length > 0) {
      return bugStatesFromApi.map((state) => state.name);
    }
    return [];
  }, [bugStatesFromApi, kind, taskStatesFromApi]);

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

  const [dayKey, setDayKey] = useState(SPRINT_DAY_ALL);

  useEffect(() => {
    resetFilters();
    setDayKey(SPRINT_DAY_ALL);
  }, [resetFilters, sprintPath]);

  useEffect(() => {
    const defaultKey = pickDefaultSprintDayKey(sprintWorkingDays);
    setDayKey((current) => {
      if (current === SPRINT_DAY_ALL) return current;
      const stillValid =
        current === SPRINT_DAY_ALL ||
        sprintWorkingDays.some((day) => day.value === current);
      return stillValid ? current : defaultKey || SPRINT_DAY_ALL;
    });
  }, [sprintPath, sprintWorkingDays]);

  const filterStates = useMemo(() => {
    if (stateNames.length > 0) return stateNames;
    return collectWorkItemStates(sprintItems);
  }, [sprintItems, stateNames]);

  const filteredItems = useMemo(() => {
    const filtered = filterSprintItemsByCriteria(sprintItems, {
      search: filters.search,
      state: filters.state,
      dayKey,
    });
    return kind === "tasks" || kind === "bugs"
      ? sortItemsByWorkingDateAsc(filtered)
      : filtered;
  }, [dayKey, filters.search, filters.state, kind, sprintItems]);

  useEffect(() => {
    if (filters.state && !filterStates.includes(filters.state)) {
      setState("");
    }
  }, [filterStates, filters.state, setState]);

  useEffect(() => {
    const assignee = filters.assignee;
    if (isWorkItemAssigneeMe(assignee) || isWorkItemAssigneeAll(assignee)) return;
    if (teamMembersLoading) return;
    if (!teamMembers.some((member) => member.displayName === assignee)) {
      setAssignee(WORK_ITEM_ASSIGNEE_ME);
    }
  }, [filters.assignee, setAssignee, teamMembers, teamMembersLoading]);

  const { contextLoading, ...contextFields } = context;

  const loading =
    adoExecutionReady &&
    (contextLoading || daysOffLoading || itemsLoading || statesLoading);

  const error =
    context.projectsError ??
    context.teamsError ??
    context.sprintsError ??
    itemsError ??
    statesError ??
    null;

  return {
    adoExecutionReady,
    loading,
    error,
    sprintName: currentSprint?.name ?? null,
    context: contextFields,
    sprintDay: {
      value: dayKey,
      workingDays: sprintWorkingDays,
      onValueChange: setDayKey,
    } satisfies {
      value: string;
      workingDays: SprintWorkingDay[];
      onValueChange: (value: string) => void;
    },
    filters: {
      values: filters,
      states: filterStates,
      members: teamMembers,
      membersLoading: teamMembersLoading,
      membersError: teamMembersError,
      totalCount: sprintItems.length,
      filteredCount: filteredItems.length,
      onSearchChange: setSearch,
      onAssigneeChange: setAssignee,
      onStateChange: setState,
    },
    items: filteredItems,
    project: project || null,
    itemStates: kind === "tasks" ? taskStatesFromApi : bugStatesFromApi,
    refetchItems: kind === "tasks" ? refetchTasks : refetchBugs,
  };
}
