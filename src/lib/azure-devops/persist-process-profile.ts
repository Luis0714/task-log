import "server-only";

import { buildProcessProfileForAuth } from "@/lib/azure-devops/process-profile";
import type { AdoCallerAuth } from "@/lib/azure-devops/resolve-auth";

/**
 * Dispara el descubrimiento del perfil ADO al conectar para que el primer acceso
 * al proyecto no tenga que esperar la detección de campos desde Azure DevOps.
 * El resultado se persiste en la BD y queda disponible para todos los usuarios.
 */
export async function triggerProjectConfigDiscovery(auth: AdoCallerAuth): Promise<void> {
  await buildProcessProfileForAuth(auth);
}
