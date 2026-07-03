import "server-only";

export type MemberInfo = {
  role: string;
  email: string;
  isRegistered: boolean;
};

/** Placeholder mostrado en el Excel cuando el assignee no existe en la DB local. */
export const UNREGISTERED_USER_PLACEHOLDER = "Usuario no registrado en NeosView";

type NeosUserRow = {
  displayName: string | null;
  email: string | null;
  roleDisplayName: string | null;
};

function normalize(s: string): string {
  return s.trim().normalize("NFC").toLowerCase();
}

/**
 * Construye un mapa de lookup indexado por displayName normalizado.
 * Fuente de verdad: tabla `users` de NeosView (tiene role + email).
 */
export function buildMemberInfoMap(neosUsers: NeosUserRow[]): Map<string, MemberInfo> {
  const map = new Map<string, MemberInfo>();
  for (const u of neosUsers) {
    if (!u.displayName) continue;
    map.set(normalize(u.displayName), {
      role: u.roleDisplayName ?? "",
      email: u.email ?? "",
      isRegistered: true,
    });
  }
  return map;
}

/**
 * Lookup raw: devuelve `MemberInfo` con `isRegistered: false` cuando no hay
 * match. Usar cuando el caller quiere saber explícitamente si el usuario
 * está registrado (ej. para decidir si mostrar un placeholder).
 */
export function lookupMember(map: Map<string, MemberInfo>, assignee: string): MemberInfo {
  return (
    map.get(normalize(assignee)) ?? { role: "", email: "", isRegistered: false }
  );
}

/**
 * Lookup con placeholder: devuelve el `MemberInfo` con el texto "Usuario no
 * registrado" en cualquier campo vacío (no registrado en la DB, o registrado
 * pero sin email/rol). Esto garantiza que el Excel nunca muestre celdas
 * vacías silenciosas.
 */
export function lookupMemberOrPlaceholder(
  map: Map<string, MemberInfo>,
  assignee: string,
): MemberInfo {
  const info = lookupMember(map, assignee);
  return {
    email: info.email.trim() === "" ? UNREGISTERED_USER_PLACEHOLDER : info.email,
    role: info.role.trim() === "" ? UNREGISTERED_USER_PLACEHOLDER : info.role,
    isRegistered: info.isRegistered,
  };
}