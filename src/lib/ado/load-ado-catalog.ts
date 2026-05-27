import "server-only";

import { cache } from "react";

import type { AdoCatalogSnapshot, AdoContextSearchParams } from "@/lib/ado/types";
import { requireAdoCaller } from "@/lib/ado/require-ado-caller";
import { listOrganizationProjects, withAdoProject } from "@/lib/azure-devops/projects";
import { listTeamSprints } from "@/lib/azure-devops/sprints";
import { resolveSuggestedTeam } from "@/lib/azure-devops/suggested-team";
import { listProjectTeams } from "@/lib/azure-devops/teams";
import { pickProject, pickSprint, pickTeam } from "@/lib/time-log/context-defaults";

const emptyCatalog: AdoCatalogSnapshot = {
  projects: [],
  teams: [],
  sprints: [],
  defaultProject: null,
  defaultTeam: null,
  suggestedTeam: null,
  project: "",
  team: "",
  sprintPath: "",
  errors: { projects: null, teams: null, sprints: null },
};

export const loadAdoCatalog = cache(async function loadAdoCatalog(
  preferredProject: string | null,
  searchParams: AdoContextSearchParams = {},
): Promise<AdoCatalogSnapshot> {
  const caller = await requireAdoCaller();
  if (!caller.ok) return emptyCatalog;

  const errors = { projects: null, teams: null, sprints: null } as AdoCatalogSnapshot["errors"];

  let projects = emptyCatalog.projects;
  const defaultProject: string | null = caller.auth.project ?? null;

  try {
    projects = await listOrganizationProjects(caller.auth);
  } catch (cause) {
    errors.projects =
      cause instanceof Error ? cause.message : "No se pudieron cargar los proyectos.";
    return { ...emptyCatalog, errors };
  }

  const project = pickProject(searchParams.project ?? "", projects, preferredProject ?? defaultProject);
  if (!project) {
    return {
      ...emptyCatalog,
      projects,
      defaultProject,
      errors,
    };
  }

  let teams = emptyCatalog.teams;
  let suggestedTeam: string | null = null;
  let defaultTeam: string | null = null;

  try {
    const scopedAuth = withAdoProject(caller.auth, project);
    teams = await listProjectTeams(scopedAuth);
    suggestedTeam = await resolveSuggestedTeam(scopedAuth, teams);
    const envTeam = process.env.AZDO_TEAM?.trim();
    defaultTeam =
      envTeam && teams.some((team) => team.name === envTeam) ? envTeam : null;
  } catch (cause) {
    errors.teams = cause instanceof Error ? cause.message : "No se pudieron cargar los equipos.";
    return {
      ...emptyCatalog,
      projects,
      defaultProject,
      errors,
    };
  }

  const team = pickTeam(
    searchParams.team ?? "",
    teams,
    defaultTeam,
    suggestedTeam,
  );

  if (!team) {
    return {
      projects,
      teams,
      sprints: [],
      defaultProject,
      defaultTeam,
      suggestedTeam,
      project,
      team: "",
      sprintPath: "",
      errors,
    };
  }

  let sprints = emptyCatalog.sprints;

  try {
    sprints = await listTeamSprints(withAdoProject(caller.auth, project), team);
  } catch (cause) {
    errors.sprints = cause instanceof Error ? cause.message : "No se pudieron cargar los sprints.";
    return {
      projects,
      teams,
      sprints: [],
      defaultProject,
      defaultTeam,
      suggestedTeam,
      project,
      team,
      sprintPath: "",
      errors,
    };
  }

  const sprintPath = pickSprint(searchParams.sprint ?? "", sprints);

  return {
    projects,
    teams,
    sprints,
    defaultProject,
    defaultTeam,
    suggestedTeam,
    project,
    team,
    sprintPath,
    errors,
  };
});
