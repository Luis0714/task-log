"use client";

import { useCallback, useEffect, useMemo } from "react";
import type { UseFormReturn } from "react-hook-form";

import { useCatalogAutoDefaults } from "@/hooks/time-log/use-catalog-auto-defaults";
import { useSprintWorkingDate } from "@/hooks/time-log/use-sprint-working-date";
import { useAdoBacklogStates } from "@/hooks/use-ado-backlog-states";
import { useAdoProjects } from "@/hooks/use-ado-projects";
import { useAdoSprintWorkItems } from "@/hooks/use-ado-sprint-work-items";
import { useAdoSprints } from "@/hooks/use-ado-sprints";
import { useAdoTaskStates } from "@/hooks/use-ado-task-states";
import { useAdoTeamMembers } from "@/hooks/use-ado-team-members";
import { useAdoTeamDaysOff } from "@/hooks/use-ado-team-days-off";
import { useAdoTeams } from "@/hooks/use-ado-teams";
import { useWorkItemFiltersPanel } from "@/hooks/filters/use-work-item-filters-panel";
import { useWorkItemFilters } from "@/hooks/use-work-item-filters";
import {
  buildCatalogDisabledState,
  buildCatalogPlaceholders,
} from "@/lib/time-log/catalog-placeholders";
import type { TimeLogCatalog } from "@/lib/time-log/catalog-types";
import { filterWorkItemsByClientCriteria } from "@/lib/time-log/filter-work-items";
import { formatSprintOptionLabel } from "@/lib/time-log/format-options";
import {
  resetPbiSelection,
  resetSprintSelection,
  resetTeamSelection,
} from "@/lib/time-log/form-selection";
import { resolveTaskStateSelection } from "@/lib/time-log/task-state-utils";
import type { TimeLogFormValues } from "@/lib/schemas/time-log";

type UseTimeLogCatalogOptions = {
  form: UseFormReturn<TimeLogFormValues>;
  adoExecutionReady: boolean;
  submitting?: boolean;
};

export type { TimeLogCatalog, TimeLogCatalogPlaceholders } from "@/lib/time-log/catalog-types";

export function useTimeLogCatalog({
  form,
  adoExecutionReady,
  submitting = false,
}: UseTimeLogCatalogOptions): TimeLogCatalog {
  const project = form.watch("project");
  const team = form.watch("team");
  const sprintPath = form.watch("sprintPath");
  const pbiId = form.watch("pbiId");
  const taskState = form.watch("taskState");

  const {
    filters: workItemFilters,
    setSearch: setWorkItemSearch,
    setAssignee: setWorkItemAssignee,
    setState: setWorkItemState,
    resetFilters: resetWorkItemFilters,
  } = useWorkItemFilters();

  const {
    projects,
    defaultProject,
    loading: projectsLoading,
    error: projectsError,
  } = useAdoProjects(adoExecutionReady);

  const {
    teams,
    defaultTeam,
    suggestedTeam,
    loading: teamsLoading,
    error: teamsError,
  } = useAdoTeams(project || undefined, adoExecutionReady);

  const {
    sprints,
    loading: sprintsLoading,
    error: sprintsError,
  } = useAdoSprints(project || undefined, team || undefined, adoExecutionReady);

  const { nonWorkingDates } = useAdoTeamDaysOff(
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

  const { states: backlogStates } = useAdoBacklogStates(
    project || undefined,
    adoExecutionReady,
  );

  const {
    workItems: sprintPbis,
    loading: pbisLoading,
    error: pbisError,
  } = useAdoSprintWorkItems(
    project || undefined,
    sprintPath || undefined,
    workItemFilters.assignee,
    adoExecutionReady,
  );

  const {
    states: taskStates,
    defaultOpenState: defaultOpenTaskState,
    loading: taskStatesLoading,
    error: taskStatesError,
  } = useAdoTaskStates(project || undefined, adoExecutionReady);

  const workItemStates = useMemo(
    () => backlogStates.map((state) => state.name),
    [backlogStates],
  );

  useEffect(() => {
    if (taskStatesLoading || taskStates.length === 0) return;
    const nextState = resolveTaskStateSelection(taskStates, taskState);
    if (nextState !== taskState) {
      form.setValue("taskState", nextState, { shouldValidate: true });
    }
  }, [form, taskState, taskStates, taskStatesLoading]);

  useCatalogAutoDefaults({
    form,
    adoExecutionReady,
    projects,
    defaultProject,
    projectsLoading,
    teams,
    defaultTeam,
    suggestedTeam,
    teamsLoading,
    project,
    sprints,
    sprintsLoading,
    team,
  });

  useSprintWorkingDate({
    form,
    sprintPath,
    sprints,
    sprintsLoading,
    workingDayOptions,
  });

  const pbis = useMemo(
    () =>
      filterWorkItemsByClientCriteria(sprintPbis, {
        search: workItemFilters.search,
        state: workItemFilters.state,
      }),
    [sprintPbis, workItemFilters.search, workItemFilters.state],
  );

  const workItemFiltersPanel = useWorkItemFiltersPanel({
    filters: workItemFilters,
    setSearch: setWorkItemSearch,
    setAssignee: setWorkItemAssignee,
    setState: setWorkItemState,
    resetFilters: resetWorkItemFilters,
    sprintPath,
    items: sprintPbis,
    stateNames: workItemStates,
    members: teamMembers,
    membersLoading: teamMembersLoading,
    membersError: teamMembersError,
    totalCount: sprintPbis.length,
    filteredCount: pbis.length,
  });

  useEffect(() => {
    if (!pbiId || pbisLoading) return;
    if (!pbis.some((item) => String(item.id) === pbiId)) {
      resetPbiSelection(form);
    }
  }, [form, pbiId, pbis, pbisLoading]);

  const onProjectChange = useCallback(() => resetTeamSelection(form), [form]);
  const onTeamChange = useCallback(() => resetSprintSelection(form), [form]);
  const onSprintChange = useCallback(() => {
    resetPbiSelection(form);
    resetWorkItemFilters();
  }, [form, resetWorkItemFilters]);

  const selectedSprint = sprints.find((sprint) => sprint.path === sprintPath);
  const selectedSprintLabel = selectedSprint ? formatSprintOptionLabel(selectedSprint) : null;
  const selectedPbi = pbis.find((item) => String(item.id) === pbiId) ?? null;

  const disabledState = buildCatalogDisabledState({
    submitting: submitting ?? false,
    adoExecutionReady,
    projectsLoading,
    teamsLoading,
    sprintsLoading,
    pbisLoading,
    project,
    team,
    sprintPath,
    pbisCount: pbis.length,
  });

  return {
    project,
    team,
    sprintPath,
    projects,
    teams,
    sprints,
    pbis,
    workItemFilters,
    workItemStates,
    workItemsTotalCount: sprintPbis.length,
    workItemsFilteredCount: pbis.length,
    projectsLoading,
    teamsLoading,
    sprintsLoading,
    pbisLoading,
    projectsError,
    teamsError,
    sprintsError,
    pbisError,
    teamMembers,
    teamMembersLoading,
    teamMembersError,
    taskStates,
    taskStatesLoading,
    taskStatesError,
    defaultOpenTaskState,
    ...disabledState,
    placeholders: buildCatalogPlaceholders({
      adoExecutionReady,
      project,
      team,
      sprintPath,
      projectsLoading,
      teamsLoading,
      sprintsLoading,
      pbisLoading,
      teamsCount: teams.length,
      sprintsCount: sprints.length,
      pbisCount: sprintPbis.length,
      filteredPbisCount: pbis.length,
    }),
    selectedSprintLabel,
    selectedPbi,
    onProjectChange,
    onTeamChange,
    onSprintChange,
    onWorkItemSearchChange: setWorkItemSearch,
    onWorkItemAssigneeChange: setWorkItemAssignee,
    onWorkItemStateChange: setWorkItemState,
  };
}
