import "server-only";

import { getConnectAuthOptions } from "@/lib/auth/connect-auth-options";
import { isIronSessionConfigured } from "@/lib/auth/session";
import { isUserPersistenceReady } from "@/lib/db/is-persistence-ready";

export type PersistenceGateResult =
  | { ok: true }
  | { ok: false; message: string; status: number };

export function requireUserPersistence(): PersistenceGateResult {
  if (!isIronSessionConfigured()) {
    return {
      ok: false,
      status: 503,
      message:
        "La sesión no está configurada en el servidor (IRON_SESSION_PASSWORD).",
    };
  }

  const { patReady } = getConnectAuthOptions();
  if (!patReady) {
    return {
      ok: false,
      status: 403,
      message: "El registro con código de acceso no está disponible.",
    };
  }

  if (!isUserPersistenceReady()) {
    return {
      ok: false,
      status: 503,
      message:
        "La base de datos no está configurada (DATABASE_URL y ENCRYPTION_KEY).",
    };
  }

  return { ok: true };
}
