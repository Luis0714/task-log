import "server-only";

import type { AdoCallerAuth } from "@/lib/azure-devops/resolve-auth";
import { listProjectTeams } from "@/lib/azure-devops/teams";
import { fetchNovedadTypeValues } from "@/lib/azure-devops/novedad-type-values";
import { listWorkItemTypeStates } from "@/lib/azure-devops/work-item-type-states";
import { NOVEDAD_WORK_ITEM_TYPE } from "@/lib/azure-devops/novedad-fields";
import { loadProjectRoster } from "@/lib/filters/load-project-roster";
import { getRepositories } from "@/lib/db";

/**
 * Opciones que dependen del proyecto elegido en el formulario de solicitud:
 * equipos del proyecto, HUs de novedades vinculadas (HU-02), miembros del
 * proyecto, tipos de solicitud y estados del work item (todos dinámicos
 * desde Azure). Reúne CA-05, CA-07/08/09, CA-13, FE-01/02.
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
  /** Equipos del proyecto a los que pertenece; se usa para filtrar por equipo. */
  teamNames: readonly string[];
}>;

export type SolicitudOptions = Readonly<{
  /** Equipos del proyecto (nombres). Vacío si el proyecto no tiene equipos. */
  teams: string[];
  newsStories: SolicitudNewsStoryOption[];
  members: SolicitudMemberOption[];
  tipos: string[];
  /** Estados válidos del WIT "Novedades" en el proyecto. */
  states: string[];
  /** `true` si falló la carga de equipos desde Azure: la UI ofrece reintentar. */
  teamsError: boolean;
  /** `true` si falló la carga de miembros desde Azure: la UI ofrece reintentar. */
  membersError: boolean;
  /** `true` si falló la carga de tipos desde Azure (FE-02): la UI ofrece reintentar. */
  tiposError: boolean;
  /** `true` si falló la carga de estados desde Azure. */
  statesError: boolean;
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

  // Cargamos equipos primero: si falla (404, permisos), seguimos intentando
  // HUs/tipos y devolvemos `teamsError=true` para que la UI muestre reintento.
  const teamsResult = await listProjectTeams(auth)
    .then((teams) => ({ teams: teams.map((team) => team.name), error: false }))
    .catch(() => ({ teams: [] as string[], error: true }));

  const [linked, roster, tiposResult, statesResult] = await Promise.all([
    repo.list({ projectIds: [auth.project] }),
    loadProjectRoster(auth),
    fetchNovedadTypeValues(auth)
      .then((values) => ({ values, error: false }))
      .catch(() => ({ values: [] as readonly string[], error: true })),
    listWorkItemTypeStates(auth, NOVEDAD_WORK_ITEM_TYPE)
      .then((items) => ({ items, error: false }))
      .catch(() => ({ items: [] as ReadonlyArray<{ name: string }>, error: true })),
  ]);

  return {
    teams: teamsResult.teams,
    newsStories: collectNewsStories(linked),
    members: roster.map((member) => ({
      id: member.uniqueName,
      displayName: member.displayName,
      uniqueName: member.uniqueName,
      teamNames: member.teamNames,
    })),
    tipos: [...tiposResult.values],
    states: statesResult.items.map((item) => item.name),
    teamsError: teamsResult.error,
    membersError: false,
    tiposError: tiposResult.error,
    statesError: statesResult.error,
  };
}
