import "server-only";

import { createHash } from "node:crypto";
import { unstable_cache } from "next/cache";

import { getTaskPilotSession, isIronSessionConfigured } from "@/lib/auth/session";
import { listOrganizationProjects, type AdoProject } from "@/lib/azure-devops/projects";
import type { AdoCallerAuth } from "@/lib/azure-devops/resolve-auth";
import { listTeamSprints, type AdoSprint } from "@/lib/azure-devops/sprints";
import { resolveSuggestedTeam } from "@/lib/azure-devops/suggested-team";
import { listProjectTeams, type AdoTeam } from "@/lib/azure-devops/teams";

/**
 * Proyectos/equipos/sprints cambian rara vez; un TTL corto ahorra las llamadas
 * ADO del catálogo en cada navegación sin cachear work items (esos siempre van
 * frescos por request).
 */
const CATALOG_REVALIDATE_SECONDS = 300;

/**
 * Scope de caché por usuario: la visibilidad del catálogo depende de la
 * credencial. En PAT la credencial es estable y se usa su hash; en OAuth el
 * access token rota en cada request, así que se usa el userId de la sesión.
 * Devuelve null cuando no hay identidad estable — en ese caso no se cachea.
 */
export async function resolveAdoCatalogCacheScope(
  auth: AdoCallerAuth,
): Promise<string | null> {
  let identity: string;
  if (auth.mode === "pat") {
    identity = `pat:${auth.pat}`;
  } else {
    if (!isIronSessionConfigured()) return null;
    const session = await getTaskPilotSession();
    const userId = session.taskPilotUserId?.trim();
    if (!userId) return null;
    identity = `user:${userId}`;
  }
  return createHash("sha256")
    .update(`${auth.mode}:${auth.organization}:${identity}`)
    .digest("hex");
}

export async function listOrganizationProjectsCached(
  auth: AdoCallerAuth,
  scope: string | null,
): Promise<AdoProject[]> {
  if (!scope) return listOrganizationProjects(auth);
  return unstable_cache(
    () => listOrganizationProjects(auth),
    ["ado-catalog-projects", scope],
    { revalidate: CATALOG_REVALIDATE_SECONDS, tags: [`ado-catalog-${scope}`] },
  )();
}

export async function listProjectTeamsCached(
  auth: AdoCallerAuth,
  scope: string | null,
): Promise<AdoTeam[]> {
  if (!scope) return listProjectTeams(auth);
  return unstable_cache(
    () => listProjectTeams(auth),
    ["ado-catalog-teams", scope, auth.project],
    { revalidate: CATALOG_REVALIDATE_SECONDS, tags: [`ado-catalog-${scope}`] },
  )();
}

export async function listTeamSprintsCached(
  auth: AdoCallerAuth,
  team: string,
  scope: string | null,
): Promise<AdoSprint[]> {
  if (!scope) return listTeamSprints(auth, team);
  return unstable_cache(
    () => listTeamSprints(auth, team),
    ["ado-catalog-sprints", scope, auth.project, team],
    { revalidate: CATALOG_REVALIDATE_SECONDS, tags: [`ado-catalog-${scope}`] },
  )();
}

export async function resolveSuggestedTeamCached(
  auth: AdoCallerAuth,
  teams: AdoTeam[],
  scope: string | null,
): Promise<string | null> {
  if (!scope) return resolveSuggestedTeam(auth, teams);
  return unstable_cache(
    () => resolveSuggestedTeam(auth, teams),
    ["ado-catalog-suggested-team", scope, auth.project],
    { revalidate: CATALOG_REVALIDATE_SECONDS, tags: [`ado-catalog-${scope}`] },
  )();
}
