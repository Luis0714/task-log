import type { AzdoAuthMethod } from "@/lib/auth/auth-method";

export function getAuthMethodLabel(authMethod: AzdoAuthMethod): string {
  if (authMethod === "pat") return "Código de acceso (servidor)";
  if (authMethod === "both") return "Conexión personal";
  return "Cuenta Microsoft";
}

export function buildConnectionMetaLine(
  organization: string | null,
  authMethod: AzdoAuthMethod,
  isConnected: boolean,
  userRole: string | null = null,
): string {
  if (!isConnected) return "Inicia sesión para conectar";
  const role = userRole?.trim();
  const label = role || getAuthMethodLabel(authMethod).toLowerCase();
  if (!organization) return label;
  return `${organization.toLowerCase()} · ${label}`;
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
