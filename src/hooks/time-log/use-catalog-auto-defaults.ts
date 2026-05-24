"use client";

import { useEffect } from "react";
import type { UseFormReturn } from "react-hook-form";

import type { AdoProjectDto, AdoSprintDto, AdoTeamDto } from "@/lib/schemas/ado-catalog";
import type { TimeLogFormValues } from "@/lib/schemas/time-log";
import { pickProject, pickSprint, pickTeam } from "@/lib/time-log/context-defaults";
import {
  resetSprintSelection,
  resetTeamSelection,
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

    const next = pickProject(form.getValues("project"), projects, defaultProject);
    if (!next || next === form.getValues("project")) return;

    form.setValue("project", next, { shouldValidate: true });
  }, [adoExecutionReady, defaultProject, form, projects, projectsLoading]);

  useEffect(() => {
    if (!project) {
      if (form.getValues("team") || form.getValues("sprintPath")) {
        resetTeamSelection(form);
      }
      return;
    }

    if (teamsLoading) return;

    const next = pickTeam(
      form.getValues("team"),
      teams,
      defaultTeam,
      suggestedTeam,
    );
    if (next === form.getValues("team")) return;

    if (!next) {
      resetTeamSelection(form);
      return;
    }

    form.setValue("team", next, { shouldValidate: true });
  }, [defaultTeam, form, project, suggestedTeam, teams, teamsLoading]);

  useEffect(() => {
    if (!team || sprintsLoading) return;

    const next = pickSprint(form.getValues("sprintPath"), sprints);
    if (next === form.getValues("sprintPath")) return;

    if (!next) {
      resetSprintSelection(form);
      return;
    }

    form.setValue("sprintPath", next, { shouldValidate: true });
  }, [form, team, sprints, sprintsLoading]);
}
