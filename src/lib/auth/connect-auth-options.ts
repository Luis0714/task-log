import "server-only";

import type { ConnectAuthOptions } from "@/lib/auth/auth-method";
import { isEntraOAuthConfigured } from "@/lib/auth/entra";
import { isIronSessionConfigured } from "@/lib/auth/session";

/** Disponibilidad real en servidor; la UI siempre muestra ambos métodos. */
export function getConnectAuthOptions(): ConnectAuthOptions {
  const sessionReady = isIronSessionConfigured();

  return {
    sessionReady,
    oauthReady: sessionReady && isEntraOAuthConfigured(),
    patReady: sessionReady,
  };
}
