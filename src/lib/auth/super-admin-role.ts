export const SUPER_ADMIN_ROLE = "super_admin";

export function isSuperAdminRole(role: string | null | undefined): boolean {
  return role === SUPER_ADMIN_ROLE;
}

/**
 * Rol que OAuth puede persistir en el primer login.
 * `super_admin` nunca se asigna desde el selector: solo existe en BD.
 */
export function toAssignableLoginRole(
  role: string | null | undefined,
): string | undefined {
  const trimmed = role?.trim();
  if (!trimmed || isSuperAdminRole(trimmed)) return undefined;
  return trimmed;
}
