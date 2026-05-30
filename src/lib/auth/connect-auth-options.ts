import "server-only";

import type { ConnectAuthOptions } from "@/lib/auth/auth-method";
import { isEntraOAuthConfigured } from "@/lib/auth/entra";
import { isIronSessionConfigured } from "@/lib/auth/session";
import { isUserPersistenceReady } from "@/lib/db/is-persistence-ready";

export function getConnectAuthOptions(): ConnectAuthOptions {
  const sessionReady = isIronSessionConfigured();
  const persistenceReady = isUserPersistenceReady();

  return {
    sessionReady,
    persistenceReady,
    oauthReady: persistenceReady && sessionReady && isEntraOAuthConfigured(),
    patReady: persistenceReady && sessionReady,
  };
}
