import "server-only";

import type { AdoCallerAuth } from "@/lib/azure-devops/resolve-auth";
import { listProjectTeams } from "@/lib/azure-devops/teams";
import { loadTeamMembers } from "@/lib/filters/load-team-members";

export type ProjectRosterMember = Readonly<{
  uniqueName: string;
  displayName: string;
  /** Equipos del proyecto a los que pertenece la persona. */
  teamNames: readonly string[];
}>;

/**
 * Roster ÚNICO del proyecto: agrega miembros de todos sus equipos usando
 * `loadTeamMembers` por equipo (mismo loader que el filtro de persona del
 * reporte de horas). Tolera fallos: un 404 en `/_apis/teams` (proyectos sin
 * equipos, permisos incompletos, etc.) no rompe al consumidor; cada equipo
 * individual también se silencia si falla. Devuelve `[]` si no se pudo cargar
 * nada.
 *
 * Conserva los nombres de equipo de cada miembro para que los formularios
 * puedan filtrar por equipo (mismo criterio que el resto de pantallas).
 */
export async function loadProjectRoster(
  auth: AdoCallerAuth,
): Promise<readonly ProjectRosterMember[]> {
  const teamNames = await listProjectTeams(auth)
    .then((items) => items.map((team) => team.name))
    .catch(() => [] as string[]);
  if (teamNames.length === 0) return [];
  const lists = await Promise.all(
    teamNames.map((team) =>
      loadTeamMembers({ project: auth.project, team }).catch(() => []),
    ),
  );
  const seen = new Map<string, ProjectRosterMember>();
  lists.forEach((list, index) => {
    const teamName = teamNames[index];
    for (const member of list) {
      const uniqueName = member.uniqueName?.trim();
      if (!uniqueName) continue;
      const existing = seen.get(uniqueName);
      if (existing) {
        if (!existing.teamNames.includes(teamName)) {
          seen.set(uniqueName, {
            ...existing,
            teamNames: [...existing.teamNames, teamName],
          });
        }
        continue;
      }
      seen.set(uniqueName, {
        uniqueName,
        displayName: member.displayName,
        teamNames: [teamName],
      });
    }
  });
  return Array.from(seen.values());
}
