import { NextResponse } from "next/server";

import {
  buildAuthorizeUrl,
  generateOAuthState,
  generatePkcePair,
  isEntraOAuthConfigured,
} from "@/lib/auth/entra";
import { getConnectAuthOptions } from "@/lib/auth/connect-auth-options";
import { getTaskPilotSession, isIronSessionConfigured } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const { oauthReady } = getConnectAuthOptions();
  if (!oauthReady) {
    return NextResponse.json(
      { error: "El inicio con cuenta Microsoft no está disponible." },
      { status: 403 },
    );
  }

  if (!isEntraOAuthConfigured() || !isIronSessionConfigured()) {
    return NextResponse.json(
      {
        error:
          "OAuth no configurado. Revisa AUTH_BASE_URL, AZURE_AD_CLIENT_ID, AZURE_AD_CLIENT_SECRET e IRON_SESSION_PASSWORD.",
      },
      { status: 503 },
    );
  }

  const state = generateOAuthState();
  const { verifier, challenge } = generatePkcePair();

  const session = await getTaskPilotSession();
  session.pendingOAuth = { state, codeVerifier: verifier };
  await session.save();

  const url = buildAuthorizeUrl({ state, codeChallenge: challenge });
  return NextResponse.redirect(url);
}
