import { NextResponse } from "next/server";

import {
  completeEntraOAuthSignIn,
  EntraSignInIncompleteError,
} from "@/lib/auth/complete-entra-oauth-sign-in";
import { exchangeCodeForTokens, getAuthBaseUrl } from "@/lib/auth/entra";
import { requirePersistenceForOAuth } from "@/lib/auth/require-user-persistence";
import { getTaskPilotSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

function redirectHome(search: string) {
  return NextResponse.redirect(new URL(`/${search}`, getAuthBaseUrl()));
}

export async function GET(req: Request) {
  const gate = requirePersistenceForOAuth();
  if (!gate.ok) {
    const detail =
      gate.status === 503 ? "persistence_unavailable" : "microsoft_unavailable";
    return redirectHome(`?azdo_error=auth&detail=${detail}`);
  }

  const url = new URL(req.url);
  const err = url.searchParams.get("error");
  if (err) {
    return redirectHome("?azdo_error=auth");
  }

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  if (!code || !state) {
    return redirectHome("?azdo_error=auth&detail=missing_code");
  }

  const session = await getTaskPilotSession();
  const pending = session.pendingOAuth;
  if (!pending || pending.state !== state) {
    return redirectHome("?azdo_error=auth&detail=invalid_state");
  }

  try {
    const tokens = await exchangeCodeForTokens({
      code,
      codeVerifier: pending.codeVerifier,
    });

    const refresh = tokens.refresh_token;
    if (!refresh) {
      return redirectHome(
        "?azdo_error=auth&detail=no_refresh_token_admin_consent",
      );
    }

    session.pendingOAuth = undefined;

    await completeEntraOAuthSignIn({
      session,
      refreshToken: refresh,
      accessToken: tokens.access_token,
    });

    await session.save();
    return redirectHome("?azdo=connected");
  } catch (error) {
    session.pendingOAuth = undefined;
    await session.save().catch(() => undefined);

    if (error instanceof EntraSignInIncompleteError) {
      return redirectHome("?azdo_error=auth&detail=incomplete_connection");
    }

    return redirectHome("?azdo_error=auth");
  }
}
