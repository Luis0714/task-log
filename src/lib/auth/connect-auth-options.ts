import "server-only";

import {
  getAzdoAuthMethod,
  type ConnectAuthOptions,
} from "@/lib/auth/auth-method";
import { isEntraOAuthConfigured } from "@/lib/auth/entra";
import { isIronSessionConfigured } from "@/lib/auth/session";

/** Qué métodos de conexión puede elegir el usuario en la UI. */
export function getConnectAuthOptions(): ConnectAuthOptions {
  const deploy = getAzdoAuthMethod();
  const sessionReady = isIronSessionConfigured();

  return {
    oauthEnabled:
      (deploy === "oauth" || deploy === "both") &&
      isEntraOAuthConfigured() &&
      sessionReady,
    patEnabled: sessionReady && (deploy === "pat" || deploy === "both"),
  };
}
