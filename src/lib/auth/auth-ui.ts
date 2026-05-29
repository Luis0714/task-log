import type { ServerAuthBootstrap } from "@/lib/auth/server-state";

/** El usuario inició sesión en este navegador (UI personalizada). */
export function isUserSignedIn(auth: ServerAuthBootstrap): boolean {
  return auth.userSessionActive;
}

/** Cargar datos reales de Azure DevOps en pantallas. */
export function canLoadLiveAdoContent(auth: ServerAuthBootstrap): boolean {
  return auth.userSessionActive && auth.adoExecutionReady;
}
