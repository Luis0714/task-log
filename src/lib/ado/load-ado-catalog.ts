import "server-only";

import { cache } from "react";

import { applyContextDefaultsToSession } from "@/lib/auth/apply-context-defaults-to-session";
import type { AdoCatalogSnapshot, AdoContextSearchParams } from "@/lib/ado/types";
import { requireAdoCaller } from "@/lib/ado/require-ado-caller";
import { getTaskPilotSession, isIronSessionConfigured } from "@/lib/auth/session";
import { listOrganizationProjects, withAdoProject } from "@/lib/azure-devops/projects";
import { listTeamSprints } from "@/lib/azure-devops/sprints";
import { resolveSuggestedTeam } from "@/lib/azure-devops/suggested-team";
import { listProjectTeams } from "@/lib/azure-devops/teams";
import {
  pickProject,
  pickSprint,
  pickTeam,
  type PickSprintOptions,
} from "@/lib/time-log/context-defaults";

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

type ResolvedDefaults = {
  defaultProject: string | null;
  defaultTeam: string | null;
};

/**
 * Resuelve los defaults de proyecto/equipo del usuario con la jerarquía:
 * 1. Sesión actual (incluye sync desde BD la primera vez).
 * 2. Registro adoConnections en BD (cross-scope fallback).
 * 3. caller.auth.project (PAT/OAuth del usuario).
 */
async function resolveContextDefaults(
  callerProject: string,
): Promise<ResolvedDefaults> {
  if (!isIronSessionConfigured()) {
    return { defaultProject: callerProject, defaultTeam: null };
  }

  const session = await getTaskPilotSession();

  if (session.taskPilotUserId?.trim()) {
    const { connection, changed } = await applyContextDefaultsToSession(session);
    if (changed) {
      await session.save();
    }

    if (connection?.project?.trim()) {
      const projectFromSession = session.defaultProject?.trim();
      const teamFromSession = session.defaultTeam?.trim();
      return {
        defaultProject: projectFromSession || connection.project.trim(),
        defaultTeam: teamFromSession || (connection.team?.trim() ?? null),
      };
    }
  }

  return {
    defaultProject: session.defaultProject?.trim() || callerProject,
    defaultTeam: session.defaultTeam?.trim() || null,
  };
}

export type LoadAdoCatalogOptions = PickSprintOptions;

export const loadAdoCatalog = cache(async function loadAdoCatalog(
  preferredProject: string | null,
  searchParams: AdoContextSearchParams = {},
  options: LoadAdoCatalogOptions = {},
): Promise<AdoCatalogSnapshot> {
  const caller = await requireAdoCaller();
  if (!caller.ok) return EMPTY_ADO_CATALOG;

  const errors = { projects: null, teams: null, sprints: null } as AdoCatalogSnapshot["errors"];

  const { defaultProject, defaultTeam: savedDefaultTeam } =
    await resolveContextDefaults(caller.auth.project ?? "");

  let projects = EMPTY_ADO_CATALOG.projects;

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

  const sprintPath = pickSprint(searchParams.sprint ?? "", sprints, options);

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
