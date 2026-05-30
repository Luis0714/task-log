import { NextResponse } from "next/server";

import {
  buildAuthorizeUrl,
  generateOAuthState,
  generatePkcePair,
} from "@/lib/auth/entra";
import { getAuthBaseUrl } from "@/lib/auth/entra";
import { requirePersistenceForOAuth } from "@/lib/auth/require-user-persistence";
import { getTaskPilotSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

function redirectWithAuthError(detail: string) {
  const base = getAuthBaseUrl();
  return NextResponse.redirect(
    new URL(`/login?azdo_error=auth&detail=${detail}`, base),
  );
}

export async function GET() {
  const gate = requirePersistenceForOAuth();
  if (!gate.ok) {
    const detail =
      gate.status === 503 ? "persistence_unavailable" : "microsoft_unavailable";
    return redirectWithAuthError(detail);
  }

  const state = generateOAuthState();
  const { verifier, challenge } = generatePkcePair();

  const session = await getTaskPilotSession();
  session.pendingOAuth = { state, codeVerifier: verifier };
  await session.save();

  const url = buildAuthorizeUrl({ state, codeChallenge: challenge });
  return NextResponse.redirect(url);
}
