import { NextResponse } from "next/server";

import {
  exchangeCodeForTokens,
  fetchAdoProfile,
  getAuthBaseUrl,
  listAdoAccounts,
  pickDefaultProject,
} from "@/lib/auth/entra";
import { getConnectAuthOptions } from "@/lib/auth/connect-auth-options";
import { getTaskPilotSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

function redirectHome(search: string) {
  return NextResponse.redirect(new URL(`/${search}`, getAuthBaseUrl()));
}

export async function GET(req: Request) {
  const { oauthEnabled } = getConnectAuthOptions();
  if (!oauthEnabled) {
    return redirectHome("?azdo_error=auth&detail=oauth_disabled");
  }

  const url = new URL(req.url);
  const err = url.searchParams.get("error");
  const errDesc = url.searchParams.get("error_description");
  if (err) {
    const q = new URLSearchParams({
      azdo_error: "auth",
      detail: errDesc ?? err,
    });
    return redirectHome(`?${q.toString()}`);
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
    session.sessionAuthMethod = "oauth";
    session.azdoPat = undefined;
    session.azdoRefreshToken = refresh;

    try {
      const profile = await fetchAdoProfile(tokens.access_token);
      session.adoProfile = profile;
      const accounts = await listAdoAccounts(tokens.access_token, profile.id);
      const firstOrg = accounts[0]?.accountName;
      session.defaultOrg = firstOrg;
      if (firstOrg) {
        session.defaultProject = await pickDefaultProject(
          tokens.access_token,
          firstOrg,
        );
      }
    } catch {
      // Tokens válidos; org/proyecto se pueden completar en una siguiente HU.
    }

    await session.save();
    return redirectHome("?azdo=connected");
  } catch {
    session.pendingOAuth = undefined;
    await session.save().catch(() => undefined);
    return redirectHome("?azdo_error=auth");
  }
}
