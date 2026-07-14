/**
 * Pantalla inicial que ve cada rol al iniciar sesión.
 *
 * Fuente única de verdad del mapeo rol → ruta de aterrizaje. Extensible:
 * para cambiar/añadir un destino, edita `ROLE_LANDING`. Módulo puro (sin
 * dependencias de Next/server) para poder reutilizarse en server y testear.
 */

export const DEFAULT_ROLE_LANDING = "/";

const ROLE_LANDING: Record<string, string> = {
  developer: "/",
  super_admin: "/",
  designer: "/time-log",
  qa: "/time-log",
  product_owner: "/reports/time-log",
  scrum_master: "/reports/time-log",
  product_manager: "/reports/time-log",
};

/**
 * Resuelve la ruta inicial para un rol. Roles desconocidos o ausentes caen
 * al Dashboard (`DEFAULT_ROLE_LANDING`).
 */
export function resolveRoleLanding(role: string | null | undefined): string {
  return (role ? ROLE_LANDING[role] : undefined) ?? DEFAULT_ROLE_LANDING;
}
