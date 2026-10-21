import { resolveRoleLanding } from "@/lib/auth/role-landing";

const MAX_RETURN_PATH_LENGTH = 2048;
const BLOCKED_PREFIXES = ["/login", "/registro", "/api/"] as const;

function hasUnsafePath(value: string): boolean {
  return (
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.startsWith("/\\") ||
    value.includes("\\") ||
    value.includes("://")
  );
}

/** Ruta interna a la que se puede volver tras iniciar sesión. */
export function sanitizeReturnPath(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const value = raw.trim();
  if (!value || value.length > MAX_RETURN_PATH_LENGTH || hasUnsafePath(value)) return null;

  let decoded = value;
  try {
    decoded = decodeURIComponent(value);
  } catch {
    return null;
  }
  if (hasUnsafePath(decoded)) return null;

  const pathOnly = decoded.split(/[?#]/)[0] ?? "";
  if (BLOCKED_PREFIXES.some((prefix) => pathOnly === prefix || pathOnly.startsWith(prefix))) {
    return null;
  }
  return value;
}

export function resolvePostLoginPath(
  returnTo: string | null | undefined,
  role: string | null | undefined,
): string {
  return sanitizeReturnPath(returnTo) ?? resolveRoleLanding(role);
}

/** Página actual, o el `returnTo` si ya estamos en login o registro. */
export function readCurrentReturnPath(): string | null {
  if (typeof window === "undefined") return null;
  const { pathname, search } = window.location;
  if (pathname === "/login" || pathname === "/registro") {
    return sanitizeReturnPath(new URLSearchParams(search).get("returnTo"));
  }
  return sanitizeReturnPath(`${pathname}${search}`);
}
