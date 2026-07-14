import "server-only";

import { adoProjectBase, escapeWiqlString } from "@/lib/azure-devops/client";
import type { AdoCallerAuth } from "@/lib/azure-devops/resolve-auth";
import { buildWiqlIdsQuery, runWiqlIdsQuery } from "@/lib/azure-devops/wiql";
import { fetchReportedNewsByIds } from "@/lib/azure-devops/list-reported-news";
import { NOVEDAD_FIELDS, NOVEDAD_WORK_ITEM_TYPE } from "@/lib/azure-devops/novedad-fields";

/**
 * Una solicitud (novedad) tal como se muestra en el listado "Mis solicitudes"
 * (CA-02): las creadas por el usuario o asignadas a él.
 */
export type SolicitudDto = Readonly<{
  id: number;
  title: string;
  tipo: string | null;
  assignedTo: string | null;
  description: string | null;
  /** Fecha de inicio como `YYYY-MM-DD` (campo DateTime de ADO, normalizado a clave civil). */
  fechaInicio: string | null;
  /** Hora de inicio `HH:mm` 24 h; `null` si el campo ADO no trae hora. */
  fechaInicioHora: string | null;
  /** Fecha de fin como `YYYY-MM-DD`. */
  fechaFin: string | null;
  /** Hora de fin `HH:mm` 24 h; `null` si el campo ADO no trae hora. */
  fechaFinHora: string | null;
  /** Fecha de reintegro como `YYYY-MM-DD` (campo DateTime de ADO). */
  fechaReintegro: string | null;
  /** Hora de reintegro `HH:mm` 24 h; `null` para datos legacy de solo fecha. */
  fechaReintegroHora: string | null;
  /** ID de la HU de novedades padre (para edición). */
  parentId: number | null;
  /** Horas de la novedad (Completed Work). */
  hours: number | null;
  state: string;
  /** Enlace directo al work item en Azure DevOps. */
  url: string;
}>;

/**
 * Novedades del proyecto en curso asignadas al usuario logueado O creadas por
 * él. Reutiliza `fetchReportedNewsByIds` para enriquecer los IDs. Devuelve `[]`
 * si la consulta falla, para no romper la pantalla.
 */
export async function listMySolicitudes(auth: AdoCallerAuth): Promise<SolicitudDto[]> {
  const conditions = [
    `[System.TeamProject] = '${escapeWiqlString(auth.project)}'`,
    `[System.WorkItemType] = '${escapeWiqlString(NOVEDAD_WORK_ITEM_TYPE)}'`,
    `[System.State] <> 'Removed'`,
    `([System.AssignedTo] = @Me OR [System.CreatedBy] = @Me)`,
  ];

  let ids: number[];
  try {
    ids = await runWiqlIdsQuery(
      auth,
      buildWiqlIdsQuery(conditions, `[${NOVEDAD_FIELDS.fechaInicio}] DESC`),
      "No se pudieron consultar tus solicitudes.",
    );
  } catch {
    return [];
  }
  if (ids.length === 0) return [];

  const details = await fetchReportedNewsByIds(auth, ids);
  const editBase = `${adoProjectBase(auth)}/_workitems/edit`;

  return details.map((item) => ({
    id: item.id,
    title: item.title,
    tipo: item.tipoNovedad,
    assignedTo: item.assignedTo,
    description: item.description,
    fechaInicio: item.fechaInicio,
    fechaInicioHora: item.fechaInicioHora,
    fechaFin: item.fechaFin,
    fechaFinHora: item.fechaFinHora,
    fechaReintegro: item.fechaReintegro,
    fechaReintegroHora: item.fechaReintegroHora,
    parentId: item.parentId,
    hours: item.completedWork,
    state: item.state,
    url: `${editBase}/${item.id}`,
  }));
}
