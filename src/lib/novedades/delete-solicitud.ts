import "server-only";

import { deleteWorkItem } from "@/lib/azure-devops/work-items";
import type { AdoCallerAuth } from "@/lib/azure-devops/resolve-auth";

/**
 * Wrapper del DELETE genérico de ADO con manejo de errores uniforme al
 * patrón del módulo de solicitudes. Devuelve un resultado discriminado en
 * lugar de lanzar, para que la ruta API lo traduzca a un mensaje HTTP.
 */
export type DeleteSolicitudResult =
  | { ok: true }
  | { ok: false; status: number; message: string };

export async function deleteSolicitud(
  auth: AdoCallerAuth,
  workItemId: number,
): Promise<DeleteSolicitudResult> {
  const result = await deleteWorkItem(workItemId, auth);
  if (!result.ok) {
    const status = result.status === 403 ? 403 : 502;
    return {
      ok: false,
      status,
      message: result.body || "No se pudo eliminar la solicitud en Azure DevOps.",
    };
  }
  return { ok: true };
}
