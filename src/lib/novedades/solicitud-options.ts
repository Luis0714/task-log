import "server-only";

import type { AdoCallerAuth } from "@/lib/azure-devops/resolve-auth";
import { listProjectTeamMembers } from "@/lib/azure-devops/team-members";
import { listProjectTeams } from "@/lib/azure-devops/teams";
import { fetchNovedadTypeValues } from "@/lib/azure-devops/novedad-type-values";
import { getRepositories } from "@/lib/db";

/**
 * Opciones que dependen del proyecto elegido en el formulario de solicitud:
 * equipos del proyecto, HUs de novedades vinculadas (HU-02), miembros del
 * proyecto y tipos de solicitud (dinámicos desde Azure). Reúne CA-05,
 * CA-07/08/09, CA-13, FE-01/02.
 *
 * Las HUs conservan su `teamId` (nombre del equipo, o `null` si se vincularon a
 * nivel de proyecto) para que el formulario las filtre por el equipo elegido:
 * las de un equipo concreto más las de nivel proyecto (que aplican a todos).
 */
export type SolicitudNewsStoryOption = Readonly<{
  workItemId: number;
  title: string;
  teamId: string | null;
}>;
export type SolicitudMemberOption = Readonly<{
  id: string;
  displayName: string;
  uniqueName: string;
}>;

export type SolicitudOptions = Readonly<{
  /** Equipos del proyecto (nombres). Vacío si el proyecto no tiene equipos. */
  teams: string[];
  newsStories: SolicitudNewsStoryOption[];
  members: SolicitudMemberOption[];
  tipos: string[];
  /** `true` si falló la carga de equipos desde Azure: la UI ofrece reintentar. */
  teamsError: boolean;
  /** `true` si falló la carga de miembros desde Azure: la UI ofrece reintentar. */
  membersError: boolean;
  /** `true` si falló la carga de tipos desde Azure (FE-02): la UI ofrece reintentar. */
  tiposError: boolean;
}>;

function collectNewsStories(
  rows: ReadonlyArray<{
    workItemId: number;
    workItemTitleSnapshot: string | null;
    teamId: string | null;
  }>,
): SolicitudNewsStoryOption[] {
  // Clave por (HU, equipo): una misma HU puede estar vinculada a varios equipos.
  const seen = new Map<string, SolicitudNewsStoryOption>();
  for (const row of rows) {
    if (!Number.isInteger(row.workItemId) || row.workItemId <= 0) continue;
    const key = `${row.workItemId}::${row.teamId ?? ""}`;
    if (seen.has(key)) continue;
    seen.set(key, {
      workItemId: row.workItemId,
      title: row.workItemTitleSnapshot?.trim() || `HU #${row.workItemId}`,
      teamId: row.teamId ?? null,
    });
  }
  return Array.from(seen.values()).sort((a, b) => a.title.localeCompare(b.title, "es"));
}

export async function loadSolicitudOptions(
  auth: AdoCallerAuth,
): Promise<SolicitudOptions> {
  const repo = getRepositories().newsStories;

  const [linked, teamsResult, membersResult, tiposResult] = await Promise.all([
    repo.list({ projectIds: [auth.project] }),
    listProjectTeams(auth).then(
      (teams) => ({ teams: teams.map((team) => team.name), error: false }),
      () => ({ teams: [] as string[], error: true }),
    ),
    listProjectTeamMembers(auth).then(
      (members) => ({ members, error: false }),
      () => ({ members: [] as Awaited<ReturnType<typeof listProjectTeamMembers>>, error: true }),
    ),
    fetchNovedadTypeValues(auth).then(
      (values) => ({ values, error: false }),
      () => ({ values: [] as readonly string[], error: true }),
    ),
  ]);

  return {
    teams: teamsResult.teams,
    newsStories: collectNewsStories(linked),
    members: membersResult.members.map((member) => ({
      id: member.id,
      displayName: member.displayName,
      uniqueName: member.uniqueName,
    })),
    tipos: [...tiposResult.values],
    teamsError: teamsResult.error,
    membersError: membersResult.error,
    tiposError: tiposResult.error,
  };
}
