"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { useAdoProjects } from "@/hooks/use-ado-projects";
import { useAdoSprints } from "@/hooks/use-ado-sprints";
import { useAdoTeams } from "@/hooks/use-ado-teams";
import { buildCatalogPlaceholders } from "@/lib/time-log/catalog-placeholders";
import { pickProject, pickSprint, pickTeam } from "@/lib/time-log/context-defaults";
import type { AdoContextSelectFieldsProps } from "@/lib/filters/context-selection-types";
import { formatSprintOptionLabel } from "@/lib/time-log/format-options";

export type UseAdoContextSelectionOptions = {
  adoExecutionReady: boolean;
  defaultProject: string | null;
  pbisLoading?: boolean;
  workItemsCount?: number;
};

export type AdoContextSelectionResult = AdoContextSelectFieldsProps & {
  contextLoading: boolean;
};

export function useAdoContextSelection({
  adoExecutionReady,
  defaultProject,
  pbisLoading = false,
  workItemsCount = 0,
}: UseAdoContextSelectionOptions): AdoContextSelectionResult {
  const [project, setProject] = useState("");
  const [team, setTeam] = useState("");
  const [sprintPath, setSprintPath] = useState("");

  const {
    projects,
    defaultProject: serverDefaultProject,
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

  const preferredProject = defaultProject ?? serverDefaultProject;

  useEffect(() => {
    if (!adoExecutionReady || projectsLoading || projects.length === 0) return;
    const next = pickProject(project, projects, preferredProject);
    if (next !== project) setProject(next);
  }, [adoExecutionReady, preferredProject, project, projects, projectsLoading]);

  useEffect(() => {
    if (!project) {
      if (team) setTeam("");
      if (sprintPath) setSprintPath("");
      return;
    }
    if (teamsLoading) return;

    const next = pickTeam(team, teams, defaultTeam, suggestedTeam);
    if (next !== team) setTeam(next);
    if (!next && sprintPath) setSprintPath("");
  }, [defaultTeam, project, sprintPath, suggestedTeam, team, teams, teamsLoading]);

  useEffect(() => {
    if (!team) {
      if (sprintPath) setSprintPath("");
      return;
    }
    if (sprintsLoading) return;

    const next = pickSprint(sprintPath, sprints);
    if (next !== sprintPath) setSprintPath(next);
  }, [sprintPath, sprints, sprintsLoading, team]);

  const onProjectChange = useCallback((value: string) => {
    setProject(value);
    setTeam("");
    setSprintPath("");
  }, []);

  const onTeamChange = useCallback((value: string) => {
    setTeam(value);
    setSprintPath("");
  }, []);

  const onSprintChange = useCallback((value: string) => {
    setSprintPath(value);
  }, []);

  const currentSprint = useMemo(
    () => sprints.find((sprint) => sprint.path === sprintPath) ?? null,
    [sprintPath, sprints],
  );

  const placeholders = useMemo(
    () =>
      buildCatalogPlaceholders({
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
        pbisCount: workItemsCount,
        filteredPbisCount: workItemsCount,
      }),
    [
      adoExecutionReady,
      pbisLoading,
      project,
      projectsLoading,
      sprintPath,
      sprints.length,
      sprintsLoading,
      team,
      teams.length,
      workItemsCount,
    ],
  );

  return {
    project,
    team,
    sprintPath,
    projects,
    teams,
    sprints,
    placeholders,
    selectedSprintLabel: currentSprint ? formatSprintOptionLabel(currentSprint) : null,
    projectSelectDisabled: !adoExecutionReady || projectsLoading,
    teamSelectDisabled: !project || teamsLoading,
    sprintSelectDisabled: !team || sprintsLoading,
    projectsError,
    teamsError,
    sprintsError,
    onProjectChange,
    onTeamChange,
    onSprintChange,
    contextLoading: projectsLoading || teamsLoading || sprintsLoading,
  };
}
