import { NextResponse } from "next/server";

import { refreshAccessToken } from "@/lib/auth/entra";
import { isOAuthAuthMethod } from "@/lib/auth/auth-method";
import { getTaskPilotSession, isIronSessionConfigured } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isOAuthAuthMethod()) {
    return NextResponse.json(
      { connected: false, reason: "oauth_disabled" },
      { status: 403 },
    );
  }

  if (!isIronSessionConfigured()) {
    return NextResponse.json({ connected: false, reason: "no_session_store" });
  }

  const session = await getTaskPilotSession();
  if (!session.azdoRefreshToken) {
    return NextResponse.json({ connected: false });
  }

  try {
    const tokens = await refreshAccessToken(session.azdoRefreshToken);
    if (tokens.refresh_token) {
      session.azdoRefreshToken = tokens.refresh_token;
      await session.save();
    }

    return NextResponse.json({
      connected: true,
      profile: session.adoProfile ?? null,
      defaultOrg: session.defaultOrg ?? null,
      defaultProject: session.defaultProject ?? null,
    });
  } catch {
    return NextResponse.json(
      {
        connected: false,
        reason: "token_invalid",
        message:
          "La sesión con Azure DevOps expiró o fue revocada. Vuelve a conectar.",
      },
      { status: 401 },
    );
  }
}
