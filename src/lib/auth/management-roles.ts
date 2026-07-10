/**
 * Roles con capacidad de gestión (D1): pueden administrar asignaciones.
 * `super_admin` queda incluido para no romper el módulo cuando el owner
 * también consulta. La regla fina de UX se aplica con `requireManagementOr403`.
 */
export const MANAGEMENT_ROLES = [
  "scrum_master",
  "product_owner",
  "product_manager",
  "super_admin",
] as const;

export type ManagementRole = (typeof MANAGEMENT_ROLES)[number];

export function isManagementRole(role: string | null | undefined): role is ManagementRole {
  if (!role) return false;
  return (MANAGEMENT_ROLES as readonly string[]).includes(role);
}
