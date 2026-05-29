import "server-only";

import { getAzdoAuthMethod } from "@/lib/auth/auth-method";
import { getTaskPilotSession, isIronSessionConfigured } from "@/lib/auth/session";

/** True si el usuario inició sesión en este navegador (no PAT solo en servidor). */
export async function hasActiveUserSession(): Promise<boolean> {
  if (!isIronSessionConfigured()) return false;

  const session = await getTaskPilotSession();
  const deploy = getAzdoAuthMethod();

  if (session.sessionAuthMethod === "pat") {
    return Boolean(
      session.azdoPat?.trim() &&
        session.defaultOrg?.trim() &&
        session.defaultProject?.trim(),
    );
  }

  if (session.sessionAuthMethod === "oauth") {
    return Boolean(
      session.azdoRefreshToken &&
        session.defaultOrg?.trim() &&
        session.defaultProject?.trim(),
    );
  }

  if (deploy === "oauth") {
    return Boolean(
      session.azdoRefreshToken &&
        session.defaultOrg?.trim() &&
        session.defaultProject?.trim(),
    );
  }

  return false;
}
