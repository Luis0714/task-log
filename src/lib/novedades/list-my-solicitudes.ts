import "server-only";

import { getServerAuthState } from "@/lib/auth/server-state";
import { listSolicitudesForUser } from "@/lib/novedades/list-solicitudes-for-user";
import type { AdoCallerAuth } from "@/lib/azure-devops/resolve-auth";

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
 * él. Wrapper de compatibilidad sobre `listSolicitudesForUser` que fija el
 * scope al proyecto actual y el filtro de asignación a `@Me`.
 *
 * Conserva la firma histórica para no romper consumidores existentes
 * (ej. `/api/solicitudes` GET inicial y `SolicitudesPage`).
 */
export async function listMySolicitudes(auth: AdoCallerAuth): Promise<SolicitudDto[]> {
  const authState = await getServerAuthState();
  return listSolicitudesForUser(
    {
      auth,
      scopes: [{ projectId: auth.project, teamId: null }],
    },
    {
      isManagement: authState.isManagement,
      currentUserDisplayName: authState.profileDisplayName,
    },
  );
}
