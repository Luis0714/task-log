"use client";

import { useCallback, useEffect, useMemo } from "react";
import type { UseFormReturn } from "react-hook-form";

import { useAdoProjects } from "@/hooks/use-ado-projects";
import { useAdoSprintWorkItems } from "@/hooks/use-ado-sprint-work-items";
import { useAdoSprints } from "@/hooks/use-ado-sprints";
import { useAdoTeams } from "@/hooks/use-ado-teams";
import { useWorkItemFilters } from "@/hooks/use-work-item-filters";
import type { AdoProjectDto, AdoSprintDto, AdoTeamDto, AdoWorkItemOptionDto } from "@/lib/schemas/ado-catalog";
import type { WorkItemFilters } from "@/lib/schemas/work-item-filters";
import type { TimeLogFormValues } from "@/lib/schemas/time-log";
import {
  collectWorkItemStates,
  filterWorkItemsByClientCriteria,
} from "@/lib/time-log/filter-work-items";
import {
  formatSprintOptionLabel,
  formatWorkItemOptionLabel,
} from "@/lib/time-log/format-options";

type UseTimeLogCatalogOptions = {
  form: UseFormReturn<TimeLogFormValues>;
  adoExecutionReady: boolean;
  submitting?: boolean;
};

export type TimeLogCatalogPlaceholders = {
  project: string;
  team: string;
  sprint: string;
  workItem: string;
};

export type TimeLogCatalog = {
  project: string;
  team: string;
  sprintPath: string;
  projects: AdoProjectDto[];
  teams: AdoTeamDto[];
  sprints: AdoSprintDto[];
  workItems: AdoWorkItemOptionDto[];
  workItemFilters: WorkItemFilters;
  workItemStates: string[];
  workItemsTotalCount: number;
  workItemsFilteredCount: number;
  projectsLoading: boolean;
  teamsLoading: boolean;
  sprintsLoading: boolean;
  workItemsLoading: boolean;
  projectsError: string | null;
  teamsError: string | null;
  sprintsError: string | null;
  workItemsError: string | null;
  catalogDisabled: boolean;
  projectSelectDisabled: boolean;
  teamSelectDisabled: boolean;
  sprintSelectDisabled: boolean;
  workItemSelectDisabled: boolean;
  placeholders: TimeLogCatalogPlaceholders;
  selectedSprintLabel: string | null;
  selectedWorkItemLabel: string | null;
  onProjectChange: () => void;
  onTeamChange: () => void;
  onSprintChange: () => void;
  onWorkItemSearchChange: (value: string) => void;
  onWorkItemAssignedToMeChange: (value: boolean) => void;
  onWorkItemStateChange: (value: string) => void;
};

function resetSprintSelection(form: UseFormReturn<TimeLogFormValues>) {
  form.setValue("sprintPath", "");
  form.setValue("workItemId", "");
  form.clearErrors(["sprintPath", "workItemId"]);
}

function resetTeamSelection(form: UseFormReturn<TimeLogFormValues>) {
  form.setValue("team", "");
  resetSprintSelection(form);
  form.clearErrors("team");
}

function resetWorkItemSelection(form: UseFormReturn<TimeLogFormValues>) {
  form.setValue("workItemId", "");
  form.clearErrors("workItemId");
}

function buildPlaceholders(
  adoExecutionReady: boolean,
  project: string,
  team: string,
  sprintPath: string,
  projectsLoading: boolean,
  teamsLoading: boolean,
  sprintsLoading: boolean,
  workItemsLoading: boolean,
  teamsCount: number,
  sprintsCount: number,
  workItemsCount: number,
  filteredWorkItemsCount: number,
): TimeLogCatalogPlaceholders {
  return {
    project: projectsLoading
      ? "Cargando proyectos..."
      : adoExecutionReady
        ? "Selecciona un proyecto"
        : "Conecta Azure DevOps para ver proyectos",
    team: !project
      ? "Primero elige un proyecto"
      : teamsLoading
        ? "Cargando equipos..."
        : teamsCount === 0
          ? "Sin equipos en este proyecto"
          : "Selecciona un equipo",
    sprint: !team
      ? "Primero elige un equipo"
      : sprintsLoading
        ? "Cargando sprints..."
        : sprintsCount === 0
          ? "Sin sprints para este equipo"
          : "Selecciona un sprint",
    workItem: !sprintPath
      ? "Primero elige un sprint"
      : workItemsLoading
        ? "Cargando work items..."
        : workItemsCount === 0
          ? "Sin work items en este sprint"
          : filteredWorkItemsCount === 0
            ? "Sin resultados con estos filtros"
            : "Selecciona un work item",
  };
}

export function useTimeLogCatalog({
  form,
  adoExecutionReady,
  submitting = false,
}: UseTimeLogCatalogOptions): TimeLogCatalog {
  const project = form.watch("project");
  const team = form.watch("team");
  const sprintPath = form.watch("sprintPath");
  const workItemId = form.watch("workItemId");

  const {
    filters: workItemFilters,
    setSearch: setWorkItemSearch,
    setAssignedToMe: setWorkItemAssignedToMe,
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

  const {
    workItems: sprintWorkItems,
    loading: workItemsLoading,
    error: workItemsError,
  } = useAdoSprintWorkItems(
    project || undefined,
    sprintPath || undefined,
    workItemFilters.assignedToMe,
    adoExecutionReady,
  );

  const workItemStates = useMemo(
    () => collectWorkItemStates(sprintWorkItems),
    [sprintWorkItems],
  );

  const workItems = useMemo(
    () =>
      filterWorkItemsByClientCriteria(sprintWorkItems, {
        search: workItemFilters.search,
        state: workItemFilters.state,
      }),
    [sprintWorkItems, workItemFilters.search, workItemFilters.state],
  );

  useEffect(() => {
    if (!adoExecutionReady || projectsLoading || projects.length === 0) return;
    if (form.getValues("project")) return;

    const preferredName =
      defaultProject && projects.some((item) => item.name === defaultProject)
        ? defaultProject
        : projects[0]?.name;

    if (preferredName) {
      form.setValue("project", preferredName, { shouldValidate: true });
    }
  }, [adoExecutionReady, defaultProject, form, projects, projectsLoading]);

  useEffect(() => {
    if (!project) {
      if (form.getValues("team") || form.getValues("sprintPath")) {
        resetTeamSelection(form);
      }
      return;
    }

    if (teamsLoading) return;

    const currentTeam = form.getValues("team");
    if (currentTeam && !teams.some((item) => item.name === currentTeam)) {
      resetTeamSelection(form);
    }

    if (teams.length === 0) {
      resetTeamSelection(form);
      return;
    }

    if (form.getValues("team")) return;

    const preferred =
      defaultTeam && teams.some((item) => item.name === defaultTeam)
        ? defaultTeam
        : suggestedTeam && teams.some((item) => item.name === suggestedTeam)
          ? suggestedTeam
          : teams[0]?.name;

    if (preferred) {
      form.setValue("team", preferred, { shouldValidate: true });
    }
  }, [defaultTeam, form, project, suggestedTeam, teams, teamsLoading]);

  useEffect(() => {
    if (!team || sprintsLoading) return;

    const currentSprint = form.getValues("sprintPath");
    if (currentSprint && !sprints.some((sprint) => sprint.path === currentSprint)) {
      resetSprintSelection(form);
    }

    if (sprints.length === 0) {
      resetSprintSelection(form);
      return;
    }

    if (form.getValues("sprintPath")) return;

    const preferred =
      sprints.find((sprint) => sprint.timeFrame === "current") ?? sprints[0];
    if (preferred) {
      form.setValue("sprintPath", preferred.path, { shouldValidate: true });
    }
  }, [form, team, sprints, sprintsLoading]);

  useEffect(() => {
    resetWorkItemFilters();
  }, [resetWorkItemFilters, sprintPath]);

  useEffect(() => {
    if (workItemFilters.state && !workItemStates.includes(workItemFilters.state)) {
      setWorkItemState("");
    }
  }, [setWorkItemState, workItemFilters.state, workItemStates]);

  useEffect(() => {
    if (!workItemId || workItemsLoading) return;

    if (!workItems.some((item) => String(item.id) === workItemId)) {
      resetWorkItemSelection(form);
    }
  }, [form, workItemId, workItems, workItemsLoading]);

  const onProjectChange = useCallback(() => {
    resetTeamSelection(form);
  }, [form]);

  const onTeamChange = useCallback(() => {
    resetSprintSelection(form);
  }, [form]);

  const onSprintChange = useCallback(() => {
    resetWorkItemSelection(form);
    resetWorkItemFilters();
  }, [form, resetWorkItemFilters]);

  const onWorkItemSearchChange = useCallback(
    (value: string) => setWorkItemSearch(value),
    [setWorkItemSearch],
  );

  const onWorkItemAssignedToMeChange = useCallback(
    (value: boolean) => setWorkItemAssignedToMe(value),
    [setWorkItemAssignedToMe],
  );

  const onWorkItemStateChange = useCallback(
    (value: string) => setWorkItemState(value),
    [setWorkItemState],
  );

  const catalogDisabled = submitting || !adoExecutionReady;

  const selectedSprint = sprints.find((sprint) => sprint.path === sprintPath);
  const selectedSprintLabel = selectedSprint
    ? formatSprintOptionLabel(selectedSprint)
    : null;

  const selectedWorkItem = workItems.find((item) => String(item.id) === workItemId);
  const selectedWorkItemLabel = selectedWorkItem
    ? formatWorkItemOptionLabel(selectedWorkItem)
    : null;

  return {
    project,
    team,
    sprintPath,
    projects,
    teams,
    sprints,
    workItems,
    workItemFilters,
    workItemStates,
    workItemsTotalCount: sprintWorkItems.length,
    workItemsFilteredCount: workItems.length,
    projectsLoading,
    teamsLoading,
    sprintsLoading,
    workItemsLoading,
    projectsError,
    teamsError,
    sprintsError,
    workItemsError,
    catalogDisabled,
    projectSelectDisabled: catalogDisabled || projectsLoading,
    teamSelectDisabled: catalogDisabled || !project || projectsLoading || teamsLoading,
    sprintSelectDisabled:
      catalogDisabled || !project || !team || teamsLoading || sprintsLoading,
    workItemSelectDisabled:
      catalogDisabled ||
      !project ||
      !team ||
      !sprintPath ||
      workItemsLoading ||
      sprintsLoading ||
      workItems.length === 0,
    placeholders: buildPlaceholders(
      adoExecutionReady,
      project,
      team,
      sprintPath,
      projectsLoading,
      teamsLoading,
      sprintsLoading,
      workItemsLoading,
      teams.length,
      sprints.length,
      sprintWorkItems.length,
      workItems.length,
    ),
    selectedSprintLabel,
    selectedWorkItemLabel,
    onProjectChange,
    onTeamChange,
    onSprintChange,
    onWorkItemSearchChange,
    onWorkItemAssignedToMeChange,
    onWorkItemStateChange,
  };
}
