import "server-only";

import { applyContextDefaultsToSession } from "@/lib/auth/apply-context-defaults-to-session";
import type { AdoCatalogSnapshot, AdoContextSearchParams } from "@/lib/ado/types";
import { requireAdoCaller } from "@/lib/ado/require-ado-caller";
import { getTaskPilotSession, isIronSessionConfigured } from "@/lib/auth/session";
import {
  listOrganizationProjectsCached,
  listProjectTeamsCached,
  resolveAdoCatalogCacheScope,
  resolveSuggestedTeamCached,
} from "@/lib/ado/ado-catalog-cache";
import { loadTeamsByProject } from "@/lib/ado/load-teams-by-project";
import { withAdoProject } from "@/lib/azure-devops/projects";
import type { AdoCallerAuth } from "@/lib/azure-devops/resolve-auth";
import { pickProject, pickTeam } from "@/lib/time-log/context-defaults";

export const EMPTY_ADO_CATALOG: AdoCatalogSnapshot = {
  projects: [],
  teams: [],
  teamsByProject: {},
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

export type CatalogCoreResult = {
  snapshot: AdoCatalogSnapshot;
  /** Credencial y scope de caché del caller, para pasos extra (p. ej. sprints). */
  auth: AdoCallerAuth | null;
  cacheScope: string | null;
};

/**
 * Pipeline compartido de los catálogos ADO: proyectos + defaults del usuario +
 * equipos del proyecto activo + mapa de equipos por proyecto. No carga
 * sprints; `loadAdoCatalog` los añade encima cuando la página los necesita.
 */
export async function loadCatalogCore(
  preferredProject: string | null,
  searchParams: AdoContextSearchParams = {},
): Promise<CatalogCoreResult> {
  const caller = await requireAdoCaller();
  if (!caller.ok) {
    return { snapshot: EMPTY_ADO_CATALOG, auth: null, cacheScope: null };
  }

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
    return { snapshot: { ...EMPTY_ADO_CATALOG, errors }, auth: caller.auth, cacheScope };
  }

  const projects = projectsResult.data;
  const project = pickProject(
    searchParams.project ?? "",
    projects,
    preferredProject ?? defaultProject,
  );

  if (!project) {
    return {
      snapshot: { ...EMPTY_ADO_CATALOG, projects, defaultProject, errors },
      auth: caller.auth,
      cacheScope,
    };
  }

  try {
    const scopedAuth = withAdoProject(caller.auth, project);
    const otherProjects = projects
      .map((item) => item.name)
      .filter((name) => name !== project);
    const [teams, otherTeams] = await Promise.all([
      listProjectTeamsCached(scopedAuth, cacheScope),
      loadTeamsByProject(caller.auth, otherProjects, cacheScope),
    ]);

    const defaultTeam =
      savedDefaultTeam && teams.some((item) => item.name === savedDefaultTeam)
        ? savedDefaultTeam
        : null;

    const requestedTeam = searchParams.team ?? "";
    const explicitTeam =
      requestedTeam && teams.some((item) => item.name === requestedTeam)
        ? requestedTeam
        : defaultTeam;

    // La sugerencia sondea las iteraciones de cada equipo (una llamada ADO por
    // equipo); solo se calcula cuando no hay equipo explícito ni default válido.
    const suggestedTeam = explicitTeam
      ? null
      : await resolveSuggestedTeamCached(scopedAuth, teams, cacheScope);

    return {
      snapshot: {
        projects,
        teams,
        teamsByProject: { ...otherTeams, [project]: teams },
        sprints: [],
        defaultProject,
        defaultTeam,
        suggestedTeam,
        project,
        team: explicitTeam ?? pickTeam(requestedTeam, teams, defaultTeam, suggestedTeam),
        sprintPath: "",
        errors,
      },
      auth: caller.auth,
      cacheScope,
    };
  } catch (cause) {
    errors.teams =
      cause instanceof Error ? cause.message : "No se pudieron cargar los equipos.";
    return {
      snapshot: { ...EMPTY_ADO_CATALOG, projects, defaultProject, errors },
      auth: caller.auth,
      cacheScope,
    };
  }
}
