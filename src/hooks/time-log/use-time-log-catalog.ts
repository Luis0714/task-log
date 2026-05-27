"use client";

import { useCallback, useEffect, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { UseFormReturn } from "react-hook-form";

import { buildAdoContextQuery } from "@/lib/ado/parse-context-search-params";

import { useAssigneeFilterFromUrl } from "@/hooks/filters/use-assignee-filter-from-url";
import { useCatalogAutoDefaults } from "@/hooks/time-log/use-catalog-auto-defaults";
import { usePushWorkItemAssigneeUrl } from "@/hooks/filters/use-push-work-item-assignee-url";
import { useSprintWorkingDate } from "@/hooks/time-log/use-sprint-working-date";
import { useWorkItemFiltersPanel } from "@/hooks/filters/use-work-item-filters-panel";
import { useTimeLogWorkItemFilters } from "@/hooks/time-log/use-time-log-work-item-filters";
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
import type {
  TimeLogPbisSnapshot,
  TimeLogServerBaseline,
} from "@/lib/time-log/load-time-log-baseline";
import type { TimeLogFormValues } from "@/lib/schemas/time-log";

type UseTimeLogCatalogOptions = {
  form: UseFormReturn<TimeLogFormValues>;
  adoExecutionReady: boolean;
  submitting?: boolean;
  serverBaseline: TimeLogServerBaseline;
  pbisSnapshot: TimeLogPbisSnapshot;
};

export type { TimeLogCatalog, TimeLogCatalogPlaceholders } from "@/lib/time-log/catalog-types";

export function useTimeLogCatalog({
  form,
  adoExecutionReady,
  submitting = false,
  serverBaseline,
  pbisSnapshot,
}: UseTimeLogCatalogOptions): TimeLogCatalog {
  const router = useRouter();
  const pathname = usePathname();
  const { pushAssignee } = usePushWorkItemAssigneeUrl();
  const { catalog } = serverBaseline;
  const project = form.watch("project");
  const team = form.watch("team");
  const sprintPath = form.watch("sprintPath");
  const pbiId = form.watch("pbiId");
  const taskState = form.watch("taskState");

  const projects = catalog.projects;
  const teams = project === catalog.project ? catalog.teams : [];
  const sprints =
    project === catalog.project && team === catalog.team ? catalog.sprints : [];
  const teamMembers =
    project === catalog.project && team === catalog.team
      ? serverBaseline.teamMembers
      : [];
  const backlogStates =
    project === catalog.project ? serverBaseline.backlogStates : [];
  const taskStates =
    project === catalog.project ? serverBaseline.taskStates : [];
  const defaultOpenTaskState = serverBaseline.defaultOpenTaskState;
  const defaultCompletedTaskState = serverBaseline.defaultCompletedTaskState;
  const nonWorkingDates = serverBaseline.nonWorkingDates;

  const workingDayOptions = useMemo(
    () => ({ nonWorkingDates: new Set(nonWorkingDates) }),
    [nonWorkingDates],
  );

  const sprintPbis = pbisSnapshot.sprintPbis;
  const pbisLoading = false;
  const pbisError = pbisSnapshot.error;

  const workItemStates = useMemo(
    () => backlogStates.map((state) => state.name),
    [backlogStates],
  );

  const {
    filters: workItemFilters,
    setSearch: setWorkItemSearch,
    setAssignee: setWorkItemAssignee,
    setStates: setWorkItemStates,
    onStatesChange: onWorkItemStatesChange,
    resetFilters: resetWorkItemFilters,
  } = useTimeLogWorkItemFilters(workItemStates);

  const { assigneeForUi } = useAssigneeFilterFromUrl(
    workItemFilters.assignee,
    setWorkItemAssignee,
  );

  const workItemFiltersWithUrlAssignee = useMemo(
    () => ({ ...workItemFilters, assignee: assigneeForUi }),
    [assigneeForUi, workItemFilters],
  );

  useEffect(() => {
    if (taskStates.length === 0) return;
    const nextState = resolveTaskStateSelection(taskStates, taskState);
    if (nextState !== taskState) {
      form.setValue("taskState", nextState, { shouldValidate: true });
    }
  }, [form, taskState, taskStates]);

  useCatalogAutoDefaults({
    form,
    adoExecutionReady,
    projects,
    defaultProject: catalog.defaultProject,
    projectsLoading: false,
    teams,
    defaultTeam: catalog.defaultTeam,
    suggestedTeam: catalog.suggestedTeam,
    teamsLoading: false,
    project,
    sprints,
    sprintsLoading: false,
    team,
  });

  useSprintWorkingDate({
    form,
    sprintPath,
    sprints,
    sprintsLoading: false,
    workingDayOptions,
  });

  const pbis = useMemo(
    () =>
      filterWorkItemsByClientCriteria(sprintPbis, {
        search: workItemFilters.search,
        states: workItemFilters.states,
      }),
    [sprintPbis, workItemFilters.search, workItemFilters.states],
  );

  useWorkItemFiltersPanel({
    filters: workItemFiltersWithUrlAssignee,
    setSearch: setWorkItemSearch,
    setAssignee: setWorkItemAssignee,
    setStates: setWorkItemStates,
    resetFilters: resetWorkItemFilters,
    sprintPath,
    items: sprintPbis,
    stateNames: workItemStates,
    members: teamMembers,
    membersLoading: false,
    membersError: null,
    totalCount: sprintPbis.length,
    filteredCount: pbis.length,
  });

  useEffect(() => {
    if (!pbiId) return;
    if (!pbis.some((item) => String(item.id) === pbiId)) {
      resetPbiSelection(form);
    }
  }, [form, pbiId, pbis]);

  const pushContextToUrl = useCallback(
    (next: { project?: string; team?: string; sprint?: string }) => {
      const values = form.getValues();
      router.push(
        `${pathname}${buildAdoContextQuery({
          project: next.project ?? values.project,
          team: next.team ?? values.team,
          sprint: next.sprint ?? values.sprintPath,
        })}`,
      );
    },
    [form, pathname, router],
  );

  const onProjectChange = useCallback(() => {
    resetTeamSelection(form);
    pushContextToUrl({ team: "", sprint: "" });
  }, [form, pushContextToUrl]);

  const onTeamChange = useCallback(() => {
    resetSprintSelection(form);
    pushContextToUrl({ sprint: "" });
  }, [form, pushContextToUrl]);

  const onSprintChange = useCallback(() => {
    resetPbiSelection(form);
    resetWorkItemFilters();
    pushContextToUrl({});
  }, [form, pushContextToUrl, resetWorkItemFilters]);

  const selectedSprint = sprints.find((sprint) => sprint.path === sprintPath);
  const selectedSprintLabel = selectedSprint ? formatSprintOptionLabel(selectedSprint) : null;
  const selectedPbi = pbis.find((item) => String(item.id) === pbiId) ?? null;

  const disabledState = buildCatalogDisabledState({
    submitting: submitting ?? false,
    adoExecutionReady,
    projectsLoading: false,
    teamsLoading: false,
    sprintsLoading: false,
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
    workItemFilters: workItemFiltersWithUrlAssignee,
    workItemStates,
    workItemsTotalCount: sprintPbis.length,
    workItemsFilteredCount: pbis.length,
    projectsLoading: false,
    teamsLoading: false,
    sprintsLoading: false,
    pbisLoading,
    projectsError: catalog.errors.projects,
    teamsError: catalog.errors.teams,
    sprintsError: catalog.errors.sprints,
    pbisError,
    teamMembers,
    teamMembersLoading: false,
    teamMembersError: null,
    taskStates,
    taskStatesLoading: false,
    taskStatesError: null,
    defaultOpenTaskState,
    defaultCompletedTaskState,
    ...disabledState,
    placeholders: buildCatalogPlaceholders({
      adoExecutionReady,
      project,
      team,
      sprintPath,
      projectsLoading: false,
      teamsLoading: false,
      sprintsLoading: false,
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
    onWorkItemAssigneeChange: (value) => {
      setWorkItemAssignee(value);
      pushAssignee(value, {
        project,
        team,
        sprint: sprintPath,
      });
    },
    onWorkItemStatesChange,
  };
}
