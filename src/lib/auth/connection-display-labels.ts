import type { AzdoAuthMethod } from "@/lib/auth/auth-method";

export function getAuthMethodLabel(authMethod: AzdoAuthMethod): string {
  if (authMethod === "pat") return "Código de acceso (servidor)";
  if (authMethod === "both") return "Conexión personal";
  return "Cuenta Microsoft";
}

/**
 * Convierte `super_admin` → `Super admin`. Si el valor no contiene
 * underscores (por ejemplo ya viene con formato legible), se devuelve sin
 * cambios para preservar el casing original.
 */
export function humanizeRole(role: string): string {
  if (!role) return "";
  if (!role.includes("_")) return role;
  return role
    .split("_")
    .filter(Boolean)
    .map(
      (part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase(),
    )
    .join(" ");
}

export type ConnectionMetaLine = {
  organization: string | null;
  role: string | null;
};

export function buildConnectionMetaLine(
  organization: string | null,
  authMethod: AzdoAuthMethod,
  isConnected: boolean,
  userRole: string | null = null,
): ConnectionMetaLine {
  if (!isConnected) {
    return { organization: null, role: null };
  }
  const trimmedRole = userRole?.trim();
  if (trimmedRole) {
    return { organization, role: humanizeRole(trimmedRole) };
  }
  return { organization, role: humanizeRole(getAuthMethodLabel(authMethod)) };
}

export function buildCompactConnectionTooltip(
  isConnected: boolean,
  authMethod: AzdoAuthMethod,
  userDisplayName: string | null,
): string {
  const status = isConnected ? "Conectado" : "Sin conectar";
  if (userDisplayName) return `${userDisplayName} · ${status}`;
  return `${status} · ${getAuthMethodLabel(authMethod)}`;
}
