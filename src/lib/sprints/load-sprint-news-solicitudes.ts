import "server-only";

import { listReportedNews } from "@/lib/azure-devops/list-reported-news";
import { resolveAdoCaller } from "@/lib/azure-devops/resolve-auth";
import { isDatabaseConfigured } from "@/lib/db/client";
import { logApiError } from "@/lib/errors/log-api-error";
import type { SprintNewsSolicitud } from "@/lib/sprints/build-sprint-news-hours-by-week";

export type LoadSprintNewsSolicitudesInput = {
  projectId: string;
  teamId: string;
  sprintStartDate: string | null | undefined;
  sprintFinishDate: string | null | undefined;
};

/**
 * Novedades reportadas del (proyecto, equipo) que se cruzan con el sprint,
 * normalizadas al input de `buildSprintNewsHoursByWeek`. Sin BD, sin conexión
 * ADO o ante error devuelve vacío: el reporte sigue funcionando sin novedades.
 */
export async function loadSprintNewsSolicitudes(
  input: LoadSprintNewsSolicitudesInput,
): Promise<SprintNewsSolicitud[]> {
  const fromKey = input.sprintStartDate?.slice(0, 10);
  const toKey = input.sprintFinishDate?.slice(0, 10);
  if (!fromKey || !toKey || !isDatabaseConfigured()) return [];

  try {
    const auth = await resolveAdoCaller();
    if (!auth) return [];

    const items = await listReportedNews({
      auth,
      scopes: [{ projectId: input.projectId, teamId: input.teamId }],
      dateFilter: { kind: "range", fromKey, toKey },
    });

    return items.flatMap((item) => {
      const assignee = item.assignedTo?.trim();
      const hours = item.completedWork ?? 0;
      if (!assignee || !item.fechaInicio || !item.fechaFin || hours <= 0) {
        return [];
      }
      return [
        {
          assignee,
          fechaInicio: item.fechaInicio,
          fechaFin: item.fechaFin,
          hours,
        },
      ];
    });
  } catch (cause) {
    logApiError("loadSprintNewsSolicitudes", cause);
    return [];
  }
}
