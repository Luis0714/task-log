import "server-only";

import { cache } from "react";

import { applyContextDefaultsToSession } from "@/lib/auth/apply-context-defaults-to-session";
import type { AdoCatalogSnapshot, AdoContextSearchParams } from "@/lib/ado/types";
import { requireAdoCaller } from "@/lib/ado/require-ado-caller";
import { getTaskPilotSession, isIronSessionConfigured } from "@/lib/auth/session";
import {
  listOrganizationProjectsCached,
  listProjectTeamsCached,
  listTeamSprintsCached,
  resolveAdoCatalogCacheScope,
  resolveSuggestedTeamCached,
} from "@/lib/ado/ado-catalog-cache";
import { withAdoProject } from "@/lib/azure-devops/projects";
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

  // Solo lee la sesión (sin red): identifica la caché por usuario/credencial.
  const cacheScope = await resolveAdoCatalogCacheScope(caller.auth);

  // Defaults (sesión/BD) y proyectos (ADO) no dependen entre sí: en paralelo.
  const [{ defaultProject, defaultTeam: savedDefaultTeam }, projectsResult] =
    await Promise.all([
      resolveContextDefaults(caller.auth.project ?? ""),
      listOrganizationProjectsCached(caller.auth, cacheScope).then(
        (data) => ({ data, error: null as string | null }),
        (cause: unknown) => ({
          data: null,
          error:
            cause instanceof Error ? cause.message : "No se pudieron cargar los proyectos.",
        }),
      ),
    ]);

  if (!projectsResult.data) {
    errors.projects = projectsResult.error;
    return { ...EMPTY_ADO_CATALOG, errors };
  }

  const projects = projectsResult.data;

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
  let team = "";

  try {
    const scopedAuth = withAdoProject(caller.auth, project);
    teams = await listProjectTeamsCached(scopedAuth, cacheScope);

    defaultTeam =
      defaultTeam && teams.some((item) => item.name === defaultTeam) ? defaultTeam : null;

    const requestedTeam = searchParams.team ?? "";
    const explicitTeam =
      requestedTeam && teams.some((item) => item.name === requestedTeam)
        ? requestedTeam
        : defaultTeam;

    // La sugerencia sondea las iteraciones de cada equipo (una llamada ADO por
    // equipo); solo se calcula cuando no hay equipo explícito ni default válido.
    if (!explicitTeam) {
      suggestedTeam = await resolveSuggestedTeamCached(scopedAuth, teams, cacheScope);
    }

    team = explicitTeam ?? pickTeam(requestedTeam, teams, defaultTeam, suggestedTeam);
  } catch (cause) {
    errors.teams = cause instanceof Error ? cause.message : "No se pudieron cargar los equipos.";
    return {
      ...EMPTY_ADO_CATALOG,
      projects,
      defaultProject,
      errors,
    };
  }

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
    sprints = await listTeamSprintsCached(withAdoProject(caller.auth, project), team, cacheScope);
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
