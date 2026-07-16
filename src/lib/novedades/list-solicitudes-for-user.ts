import "server-only";

import { adoProjectBase } from "@/lib/azure-devops/client";
import {
  listReportedNews,
  type ReportedNewsDateFilter,
  type ReportedNewsScope,
} from "@/lib/azure-devops/list-reported-news";
import type { AdoCallerAuth } from "@/lib/azure-devops/resolve-auth";
import { WORK_ITEM_ASSIGNEE_ME } from "@/lib/schemas/work-item-filters";
import type { SolicitudDto } from "@/lib/novedades/list-my-solicitudes";

export type ListSolicitudesForUserArgs = Readonly<{
  auth: AdoCallerAuth;
  scopes: ReadonlyArray<ReportedNewsScope>;
  dateFilter?: ReportedNewsDateFilter;
  /** Filtro de asignación en formato `serializeAssigneeSelection`. Si el
   *  usuario no tiene rol de gestión, este valor se IGNORA y se fuerza a
   *  `WORK_ITEM_ASSIGNEE_ME` para no exponer datos de otros colaboradores. */
  assigneeFilter?: string;
}>;

export type ListSolicitudesForUserDeps = Readonly<{
  isManagement: boolean;
  /**
   * Display name del usuario actual (informativo; no se filtra por él
   * directamente porque WIQL usa `@Me`).
   */
  currentUserDisplayName: string | null;
}>;

/**
 * Wrapper con política de rol sobre `listReportedNews`. Los roles de gestión
 * (super_admin, scrum_master, product_owner, product_manager) reciben las
 * novedades tal cual las pida el cliente; los demás usuarios SOLO pueden ver
 * sus propias novedades (asignadas o creadas por ellos) — el filtro de
 * asignación se fuerza a `@Me` aquí mismo.
 *
 * El shape de salida es `SolicitudDto` para mantener compatibilidad con el
 * resto del módulo (form dialog, table, hooks).
 */
export async function listSolicitudesForUser(
  args: ListSolicitudesForUserArgs,
  deps: ListSolicitudesForUserDeps,
): Promise<SolicitudDto[]> {
  if (args.scopes.length === 0) return [];

  const effectiveAssignee = deps.isManagement
    ? args.assigneeFilter
    : WORK_ITEM_ASSIGNEE_ME;

  const items = await listReportedNews({
    auth: args.auth,
    scopes: args.scopes,
    dateFilter: args.dateFilter,
    ...(effectiveAssignee ? { assignee: effectiveAssignee } : {}),
  });

  const editBase = `${adoProjectBase(args.auth)}/_workitems/edit`;
  return items.map((item) => ({
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
