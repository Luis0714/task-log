import "server-only";

import { refreshAccessToken } from "@/lib/auth/entra";
import { syncOAuthRefreshToDatabase } from "@/lib/auth/sync-oauth-refresh-to-db";
import {
  clearSessionCredentials,
  getTaskPilotSession,
  isIronSessionConfigured,
} from "@/lib/auth/session";
import { getRepositories, isUserPersistenceReady } from "@/lib/db";

export type AdoCallerAuth =
  | { mode: "oauth"; accessToken: string; organization: string; project: string }
  | { mode: "pat"; organization: string; project: string; pat: string };

export type ResolveAdoCallerOptions = {
  /** Solo en Route Handlers / Server Actions (Next.js no permite escribir cookies en RSC). */
  persistOAuthTokens?: boolean;
};

/** Credenciales ADO desde la base de datos (cuenta TaskPilot en sesión). */
export async function resolveAdoCaller(
  options: ResolveAdoCallerOptions = {},
): Promise<AdoCallerAuth | null> {
  if (!isIronSessionConfigured() || !isUserPersistenceReady()) {
    return null;
  }

  const session = await getTaskPilotSession();
  const userId = session.taskPilotUserId?.trim();
  if (!userId) return null;

  let connection;
  try {
    connection = await getRepositories().adoConnection.loadByUserId(userId);
  } catch {
    return null;
  }

  if (!connection) return null;

  const organization = connection.organization.trim();
  const project = connection.project.trim();
  if (!organization || !project) return null;

  if (connection.authMethod === "pat") {
    return {
      mode: "pat",
      organization,
      project,
      pat: connection.pat,
    };
  }

  try {
    const tokens = await refreshAccessToken(connection.refreshToken);
    if (tokens.refresh_token && options.persistOAuthTokens) {
      await syncOAuthRefreshToDatabase(session, tokens.refresh_token);
    }
    return {
      mode: "oauth",
      accessToken: tokens.access_token,
      organization,
      project,
    };
  } catch {
    return null;
  }
}

export async function isSessionPatReady(): Promise<boolean> {
  const caller = await resolveAdoCaller();
  return caller?.mode === "pat";
}

export async function isSessionOAuthReady(): Promise<boolean> {
  const caller = await resolveAdoCaller();
  return caller?.mode === "oauth";
}

export async function clearUserSessionAuth(): Promise<void> {
  if (!isIronSessionConfigured()) return;
  const session = await getTaskPilotSession();
  clearSessionCredentials(session);
  await session.save();
}
