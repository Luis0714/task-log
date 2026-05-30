import { NextResponse } from "next/server";

import { refreshAccessToken } from "@/lib/auth/entra";
import { isOAuthAuthMethod } from "@/lib/auth/auth-method";
import { syncOAuthRefreshToDatabase } from "@/lib/auth/sync-oauth-refresh-to-db";
import { USER_MESSAGES } from "@/lib/errors/user-messages";
import { getTaskPilotSession, isIronSessionConfigured } from "@/lib/auth/session";
import { loadUserAdoConnection } from "@/lib/db/load-user-ado-connection";
import { isUserPersistenceReady } from "@/lib/db/is-persistence-ready";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isOAuthAuthMethod()) {
    return NextResponse.json({ connected: false, reason: "oauth_disabled" });
  }

  if (!isIronSessionConfigured() || !isUserPersistenceReady()) {
    return NextResponse.json({
      connected: false,
      reason: "service_unavailable",
      message: USER_MESSAGES.persistenceUnavailable,
    });
  }

  const session = await getTaskPilotSession();
  const userId = session.taskPilotUserId?.trim();
  if (!userId || session.sessionAuthMethod !== "oauth") {
    return NextResponse.json({ connected: false });
  }

  let connection;
  try {
    connection = await loadUserAdoConnection(userId);
  } catch {
    return NextResponse.json({
      connected: false,
      message: USER_MESSAGES.loadFailed,
    });
  }

  if (!connection || connection.authMethod !== "oauth") {
    return NextResponse.json({ connected: false });
  }

  try {
    const tokens = await refreshAccessToken(connection.refreshToken);
    if (tokens.refresh_token) {
      await syncOAuthRefreshToDatabase(session, tokens.refresh_token);
    }

    return NextResponse.json({
      connected: true,
      profile: session.adoProfile ?? null,
      defaultOrg: connection.organization,
      defaultProject: connection.project,
    });
  } catch {
    return NextResponse.json(
      {
        connected: false,
        reason: "token_invalid",
        message:
          "Tu sesión con Microsoft expiró. Vuelve a iniciar sesión con tu cuenta.",
      },
      { status: 401 },
    );
  }
}
