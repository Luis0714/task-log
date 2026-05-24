"use client";

import { useEffect } from "react";
import type { UseFormReturn } from "react-hook-form";

import type { AdoProjectDto, AdoSprintDto, AdoTeamDto } from "@/lib/schemas/ado-catalog";
import type { TimeLogFormValues } from "@/lib/schemas/time-log";
import {
  resetSprintSelection,
  resetTeamSelection,
  resolvePreferredProject,
  resolvePreferredSprint,
  resolvePreferredTeam,
} from "@/lib/time-log/form-selection";

type UseCatalogAutoDefaultsOptions = {
  form: UseFormReturn<TimeLogFormValues>;
  adoExecutionReady: boolean;
  projects: AdoProjectDto[];
  defaultProject: string | null;
  projectsLoading: boolean;
  teams: AdoTeamDto[];
  defaultTeam: string | null;
  suggestedTeam: string | null;
  teamsLoading: boolean;
  project: string;
  sprints: AdoSprintDto[];
  sprintsLoading: boolean;
  team: string;
};

export function useCatalogAutoDefaults({
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
}: UseCatalogAutoDefaultsOptions) {
  useEffect(() => {
    if (!adoExecutionReady || projectsLoading || projects.length === 0) return;
    if (form.getValues("project")) return;

    const preferred = resolvePreferredProject(projects, defaultProject);
    if (preferred) {
      form.setValue("project", preferred, { shouldValidate: true });
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

    const preferred = resolvePreferredTeam(teams, defaultTeam, suggestedTeam);
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

    const preferred = resolvePreferredSprint(sprints);
    if (preferred) {
      form.setValue("sprintPath", preferred, { shouldValidate: true });
    }
  }, [form, team, sprints, sprintsLoading]);
}
