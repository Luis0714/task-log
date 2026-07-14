import "server-only";

import { cache } from "react";

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
import {
  pickProject,
  pickTeam,
} from "@/lib/time-log/context-defaults";

export const EMPTY_ASSIGNMENTS_CATALOG: AdoCatalogSnapshot = {
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

async function resolveContextDefaults(
  callerProject: string,
): Promise<ResolvedDefaults> {
  if (!isIronSessionConfigured()) {
    return { defaultProject: callerProject, defaultTeam: null };
  }
  const session = await getTaskPilotSession();
  if (session.taskPilotUserId?.trim()) {
    const { connection, changed } = await applyContextDefaultsToSession(session);
    if (changed) await session.save();
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

/**
 * Equivalente de `loadAdoCatalog` para la página de asignaciones:
 * resuelve projects + teams del proyecto seleccionado, sin cargar sprints.
 */
export const loadAssignmentsCatalog = cache(async function loadAssignmentsCatalog(
  searchParams: AdoContextSearchParams = {},
): Promise<AdoCatalogSnapshot> {
  const caller = await requireAdoCaller();
  if (!caller.ok) return EMPTY_ASSIGNMENTS_CATALOG;

  const errors = {
    projects: null,
    teams: null,
    sprints: null,
  } as AdoCatalogSnapshot["errors"];

  const cacheScope = await resolveAdoCatalogCacheScope(caller.auth);

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
    return { ...EMPTY_ASSIGNMENTS_CATALOG, errors };
  }

  const projects = projectsResult.data;
  const project = pickProject(
    searchParams.project ?? "",
    projects,
    defaultProject,
  );

  if (!project) {
    return { ...EMPTY_ASSIGNMENTS_CATALOG, projects, defaultProject, errors };
  }

  let teams = EMPTY_ASSIGNMENTS_CATALOG.teams;
  let teamsByProject = EMPTY_ASSIGNMENTS_CATALOG.teamsByProject;
  let suggestedTeam: string | null = null;
  let defaultTeam: string | null = savedDefaultTeam;
  let team = "";

  try {
    const scopedAuth = withAdoProject(caller.auth, project);
    const otherProjects = projects
      .map((item) => item.name)
      .filter((name) => name !== project);
    const [projectTeams, otherTeams] = await Promise.all([
      listProjectTeamsCached(scopedAuth, cacheScope),
      loadTeamsByProject(caller.auth, otherProjects, cacheScope),
    ]);
    teams = projectTeams;
    teamsByProject = { ...otherTeams, [project]: projectTeams };

    defaultTeam =
      defaultTeam && teams.some((item) => item.name === defaultTeam)
        ? defaultTeam
        : null;

    const requestedTeam = searchParams.team ?? "";
    const explicitTeam =
      requestedTeam && teams.some((item) => item.name === requestedTeam)
        ? requestedTeam
        : defaultTeam;

    if (!explicitTeam) {
      suggestedTeam = await resolveSuggestedTeamCached(
        scopedAuth,
        teams,
        cacheScope,
      );
    }
    team = explicitTeam ?? pickTeam(requestedTeam, teams, defaultTeam, suggestedTeam);
  } catch (cause) {
    errors.teams =
      cause instanceof Error ? cause.message : "No se pudieron cargar los equipos.";
    return {
      ...EMPTY_ASSIGNMENTS_CATALOG,
      projects,
      defaultProject,
      errors,
    };
  }

  return {
    projects,
    teams,
    teamsByProject,
    sprints: [],
    defaultProject,
    defaultTeam,
    suggestedTeam,
    project,
    team,
    sprintPath: "",
    errors,
  };
});
