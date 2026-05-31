import "server-only";

import { cache } from "react";

import type { AdoCatalogSnapshot, AdoContextSearchParams } from "@/lib/ado/types";
import { requireAdoCaller } from "@/lib/ado/require-ado-caller";
import { getTaskPilotSession, isIronSessionConfigured } from "@/lib/auth/session";
import { getRepositories, isUserPersistenceReady } from "@/lib/db";
import { listOrganizationProjects, withAdoProject } from "@/lib/azure-devops/projects";
import { listTeamSprints } from "@/lib/azure-devops/sprints";
import { resolveSuggestedTeam } from "@/lib/azure-devops/suggested-team";
import { listProjectTeams } from "@/lib/azure-devops/teams";
import { pickProject, pickSprint, pickTeam } from "@/lib/time-log/context-defaults";

export const EMPTY_ADO_CATALOG: AdoCatalogSnapshot = {
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
  if (!caller.ok) return EMPTY_ADO_CATALOG;

  const errors = { projects: null, teams: null, sprints: null } as AdoCatalogSnapshot["errors"];

  let projects = EMPTY_ADO_CATALOG.projects;
  let savedDefaultProject: string | null = caller.auth.project ?? null;
  let savedDefaultTeam: string | null = null;

  if (isIronSessionConfigured()) {
    const session = await getTaskPilotSession();
    const sessionProject = session.defaultProject?.trim();
    const sessionTeam = session.defaultTeam?.trim();

    if (sessionProject) savedDefaultProject = sessionProject;
    if (sessionTeam) savedDefaultTeam = sessionTeam;

    if (isUserPersistenceReady() && session.taskPilotUserId?.trim()) {
      try {
        const connection = await getRepositories().adoConnection.loadByUserId(
          session.taskPilotUserId.trim(),
        );
        if (connection) {
          savedDefaultProject = sessionProject ?? connection.project.trim();
          savedDefaultTeam = sessionTeam ?? connection.team?.trim() ?? null;
        }
      } catch {
        // Mantener valores de sesión.
      }
    }
  }

  const defaultProject = savedDefaultProject;

  try {
    projects = await listOrganizationProjects(caller.auth);
  } catch (cause) {
    errors.projects =
      cause instanceof Error ? cause.message : "No se pudieron cargar los proyectos.";
    return { ...EMPTY_ADO_CATALOG, errors };
  }

  const project = pickProject(searchParams.project ?? "", projects, preferredProject ?? defaultProject);
  if (!project) {
    return {
      ...EMPTY_ADO_CATALOG,
      projects,
      defaultProject,
      errors,
    };
  }

  let teams = EMPTY_ADO_CATALOG.teams;
  let suggestedTeam: string | null = null;
  let defaultTeam: string | null = savedDefaultTeam;

  try {
    const scopedAuth = withAdoProject(caller.auth, project);
    teams = await listProjectTeams(scopedAuth);
    suggestedTeam = await resolveSuggestedTeam(scopedAuth, teams);

    defaultTeam =
      defaultTeam && teams.some((item) => item.name === defaultTeam) ? defaultTeam : null;
  } catch (cause) {
    errors.teams = cause instanceof Error ? cause.message : "No se pudieron cargar los equipos.";
    return {
      ...EMPTY_ADO_CATALOG,
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

  let sprints = EMPTY_ADO_CATALOG.sprints;

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
