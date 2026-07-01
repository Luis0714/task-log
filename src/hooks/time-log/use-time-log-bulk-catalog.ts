"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { usePendingSelectField } from "@/hooks/filters/use-pending-select-field";
import { useSavePageDefaults } from "@/hooks/filters/use-save-page-defaults";
import { useTimeLogWorkItemFilters } from "@/hooks/time-log/use-time-log-work-item-filters";
import { mergeAdoContextIntoSearchParams } from "@/lib/ado/parse-context-search-params";
import { filterWorkItemsByClientCriteria } from "@/lib/time-log/filter-work-items";
import { formatSprintOptionLabel } from "@/lib/time-log/format-options";
import {
  buildCatalogDisabledState,
  buildCatalogPlaceholders,
} from "@/lib/time-log/catalog-placeholders";
import type { TimeLogCatalog } from "@/lib/time-log/catalog-types";
import { pickProject, pickSprint, pickTeam } from "@/lib/time-log/context-defaults";
import type {
  TimeLogPbisSnapshot,
  TimeLogServerBaseline,
} from "@/lib/time-log/load-time-log-baseline";
import { USER_FILTER_SCOPES } from "@/lib/filters/user-filter-scopes";

type UseTimeLogBulkCatalogOptions = {
  adoExecutionReady: boolean;
  serverBaseline: TimeLogServerBaseline;
  pbisSnapshot: TimeLogPbisSnapshot;
  isTaskCreationMode: boolean;
};

export function useTimeLogBulkCatalog({
  adoExecutionReady,
  serverBaseline,
  pbisSnapshot,
  isTaskCreationMode,
}: UseTimeLogBulkCatalogOptions): TimeLogCatalog {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { catalog } = serverBaseline;

  const { isPending: contextPending, pendingField, runPending } = usePendingSelectField();

  const [project, setProject] = useState(catalog.project ?? "");
  const [team, setTeam] = useState(catalog.team ?? "");
  const [sprintPath, setSprintPath] = useState(catalog.sprintPath ?? "");

  // Stay in sync when the server re-renders with a new context (e.g. from Individual view)
  useEffect(() => { setProject(catalog.project ?? ""); }, [catalog.project]);
  useEffect(() => { setTeam(catalog.team ?? ""); }, [catalog.team]);
  useEffect(() => { setSprintPath(catalog.sprintPath ?? ""); }, [catalog.sprintPath]);

  const projects = catalog.projects;
  const teams = project === catalog.project ? catalog.teams : [];
  const sprints =
    project === catalog.project && team === catalog.team ? catalog.sprints : [];
  const teamMembers =
    project === catalog.project && team === catalog.team
      ? serverBaseline.teamMembers
      : [];
  const backlogStates = project === catalog.project ? serverBaseline.backlogStates : [];
  const taskStates = project === catalog.project ? serverBaseline.taskStates : [];

  const workItemStates = useMemo(() => backlogStates.map((s) => s.name), [backlogStates]);

  const {
    filters: workItemFilters,
    setSearch: setWorkItemSearch,
    setAssignee: setWorkItemAssignee,
    setStates: setWorkItemStates,
    resetFilters: resetWorkItemFilters,
  } = useTimeLogWorkItemFilters();

  const sprintPbis = pbisSnapshot.sprintPbis;
  const pbisLoading = false;

  const pbis = useMemo(
    () =>
      filterWorkItemsByClientCriteria(sprintPbis, {
        search: workItemFilters.search,
        states: workItemFilters.states,
      }),
    [sprintPbis, workItemFilters.search, workItemFilters.states],
  );

  const teamsLoading = contextPending && pendingField === "project";
  const sprintsLoading =
    contextPending && (pendingField === "project" || pendingField === "team");

  useEffect(() => {
    if (!adoExecutionReady || projects.length === 0) return;
    const next = pickProject(project, projects, catalog.defaultProject);
    if (next && next !== project) setProject(next);
  }, [adoExecutionReady, catalog.defaultProject, project, projects]);

  useEffect(() => {
    if (!project || teamsLoading) return;
    const next = pickTeam(team, teams, catalog.defaultTeam, catalog.suggestedTeam);
    if (next === team) return;
    if (!next) {
      setTeam("");
      setSprintPath("");
    } else {
      setTeam(next);
    }
  }, [catalog.defaultTeam, catalog.suggestedTeam, project, team, teams, teamsLoading]);

  useEffect(() => {
    if (!team || sprintsLoading) return;
    const next = pickSprint(sprintPath, sprints);
    if (next === sprintPath) return;
    setSprintPath(next ?? "");
  }, [sprintPath, sprints, sprintsLoading, team]);

  const { save: savePageDefaults, pending: saveDefaultsPending } = useSavePageDefaults({
    project,
    team,
    scope: USER_FILTER_SCOPES.timeLog,
    filters: workItemFilters,
  });

  const pushContext = useCallback(
    (next: { project?: string; team?: string; sprint?: string }) => {
      const current = new URLSearchParams(searchParams.toString());
      const query = mergeAdoContextIntoSearchParams(current, {
        project: next.project ?? project,
        team: next.team ?? team,
        sprint: next.sprint ?? sprintPath,
      });
      router.push(`${pathname}${query}`, { scroll: false });
    },
    [pathname, project, router, searchParams, sprintPath, team],
  );

  const onProjectChange = runPending("project", (value: string) => {
    setProject(value);
    setTeam("");
    setSprintPath("");
    pushContext({ project: value, team: "", sprint: "" });
  });

  const onTeamChange = runPending("team", (value: string) => {
    setTeam(value);
    setSprintPath("");
    pushContext({ team: value, sprint: "" });
  });

  const onSprintChange = runPending("sprint", (value: string) => {
    setSprintPath(value);
    resetWorkItemFilters();
    pushContext({ sprint: value });
  });

  const selectedSprint = sprints.find((s) => s.path === sprintPath);
  const selectedSprintLabel = selectedSprint ? formatSprintOptionLabel(selectedSprint) : null;

  const disabledState = buildCatalogDisabledState({
    submitting: false,
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
    workItemFilters,
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
    pbisError: pbisSnapshot.error,
    teamMembers,
    teamMembersLoading: false,
    teamMembersError: null,
    taskStates,
    taskStatesLoading: false,
    taskStatesError: null,
    defaultOpenTaskState: serverBaseline.defaultOpenTaskState,
    defaultCompletedTaskState: serverBaseline.defaultCompletedTaskState,
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
    selectedPbi: null,
    onProjectChange,
    onTeamChange,
    onSprintChange,
    onWorkItemSearchChange: setWorkItemSearch,
    onWorkItemAssigneeChange: setWorkItemAssignee,
    onWorkItemStatesChange: setWorkItemStates,
    onWorkItemSaveAsDefaults: savePageDefaults,
    defaultProject: catalog.defaultProject,
    defaultTeam: catalog.defaultTeam,
    saveDefaultsPending,
    onSaveDefaults: savePageDefaults,
    isTaskCreationMode,
  };
}
