"use client";

import { useCallback, useEffect, useMemo, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { UseFormReturn } from "react-hook-form";

import { mergeAdoContextIntoSearchParams } from "@/lib/ado/parse-context-search-params";

import { useAssigneeFilterFromUrl } from "@/hooks/filters/use-assignee-filter-from-url";
import { useCatalogAutoDefaults } from "@/hooks/time-log/use-catalog-auto-defaults";
import { usePushWorkItemAssigneeUrl } from "@/hooks/filters/use-push-work-item-assignee-url";
import { useSprintWorkingDate } from "@/hooks/time-log/use-sprint-working-date";
import { useWorkItemFiltersPanel } from "@/hooks/filters/use-work-item-filters-panel";
import { useTimeLogWorkItemFilters } from "@/hooks/time-log/use-time-log-work-item-filters";
import { usePendingSelectField } from "@/hooks/filters/use-pending-select-field";
import { useSavePageDefaults } from "@/hooks/filters/use-save-page-defaults";
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
import type { WorkItemFilters } from "@/lib/schemas/work-item-filters";
import { USER_FILTER_SCOPES } from "@/lib/filters/user-filter-scopes";

type UseTimeLogCatalogOptions = {
  form: UseFormReturn<TimeLogFormValues>;
  adoExecutionReady: boolean;
  submitting?: boolean;
  serverBaseline: TimeLogServerBaseline;
  pbisSnapshot: TimeLogPbisSnapshot;
  isTaskCreationMode: boolean;
  initialWorkItemFilters?: Partial<WorkItemFilters>;
};

export type { TimeLogCatalog, TimeLogCatalogPlaceholders } from "@/lib/time-log/catalog-types";

export function useTimeLogCatalog({
  form,
  adoExecutionReady,
  submitting = false,
  serverBaseline,
  pbisSnapshot,
  isTaskCreationMode,
  initialWorkItemFilters,
}: UseTimeLogCatalogOptions): TimeLogCatalog {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { pushAssignee } = usePushWorkItemAssigneeUrl();
  const { catalog } = serverBaseline;
  const { isPending: contextPending, pendingField, runPending } =
    usePendingSelectField();
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

  const [pbisNavigating, startPbisNavigation] = useTransition();

  const sprintPbis = pbisSnapshot.sprintPbis;
  const pbisLoading = pbisNavigating;
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
    resetFilters: resetWorkItemFilters,
  } = useTimeLogWorkItemFilters(initialWorkItemFilters);

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

    // En modo time-log (sin ?create=1) la tarea siempre termina en Done, así
    // que fijamos el estado inicial al Done por defecto. En modo creación de
    // tarea conservamos el comportamiento previo: estado abierto por defecto.
    const nextState = isTaskCreationMode
      ? resolveTaskStateSelection(taskStates, taskState)
      : (defaultCompletedTaskState ?? resolveTaskStateSelection(taskStates, taskState));

    if (nextState !== taskState) {
      form.setValue("taskState", nextState, { shouldValidate: true });
    }
  }, [defaultCompletedTaskState, form, isTaskCreationMode, taskState, taskStates]);

  const teamsLoading = contextPending && pendingField === "project";
  const sprintsLoading =
    contextPending && (pendingField === "project" || pendingField === "team");

  useCatalogAutoDefaults({
    form,
    adoExecutionReady,
    projects,
    defaultProject: catalog.defaultProject,
    projectsLoading: false,
    teams,
    defaultTeam: catalog.defaultTeam,
    suggestedTeam: catalog.suggestedTeam,
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
        states: workItemFilters.states,
      }),
    [sprintPbis, workItemFilters.search, workItemFilters.states],
  );

  const { save: savePageDefaults, pending: saveDefaultsPending } =
    useSavePageDefaults({
      project,
      team,
      scope: USER_FILTER_SCOPES.timeLog,
      filters: workItemFilters,
    });

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
    onSaveAsDefaults: savePageDefaults,
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
      // Mergemos sobre los search params actuales para preservar flags que
      // no son del contexto ADO (p. ej. `modo=multiple`), en lugar de
      // reconstruir la URL desde cero y perderlos.
      const current = new URLSearchParams(searchParams.toString());
      const query = mergeAdoContextIntoSearchParams(current, {
        project: next.project ?? values.project,
        team: next.team ?? values.team,
        sprint: next.sprint ?? values.sprintPath,
      });
      router.push(`${pathname}${query}`, { scroll: false });
    },
    [form, pathname, router, searchParams],
  );

  const onProjectChange = runPending("project", () => {
    resetTeamSelection(form);
    pushContextToUrl({ team: "", sprint: "" });
  });

  const onTeamChange = runPending("team", () => {
    resetSprintSelection(form);
    pushContextToUrl({ sprint: "" });
  });

  const onSprintChange = runPending("sprint", () => {
    resetPbiSelection(form);
    resetWorkItemFilters();
    pushContextToUrl({});
  });

  const selectedSprint = sprints.find((sprint) => sprint.path === sprintPath);
  const selectedSprintLabel = selectedSprint ? formatSprintOptionLabel(selectedSprint) : null;
  const selectedPbi = pbis.find((item) => String(item.id) === pbiId) ?? null;

  const disabledState = buildCatalogDisabledState({
    submitting: submitting ?? false,
    adoExecutionReady,
    projectsLoading: false,
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
    workItemFilters: workItemFiltersWithUrlAssignee,
    workItemStates,
    workItemsTotalCount: sprintPbis.length,
    workItemsFilteredCount: pbis.length,
    projectsLoading: false,
    teamsLoading,
    sprintsLoading,
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
    onWorkItemAssigneeChange: (value) => {
      setWorkItemAssignee(value);
      startPbisNavigation(() => {
        pushAssignee(value, {
          project,
          team,
          sprint: sprintPath,
        });
      });
    },
    onWorkItemStatesChange: setWorkItemStates,
    onWorkItemSaveAsDefaults: savePageDefaults,
    defaultProject: catalog.defaultProject,
    defaultTeam: catalog.defaultTeam,
    saveDefaultsPending,
    onSaveDefaults: savePageDefaults,
    isTaskCreationMode,
  };
}
