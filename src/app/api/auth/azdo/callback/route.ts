import {
  completeEntraOAuthSignIn,
  EntraSignInDisabledError,
  EntraSignInIncompleteError,
} from "@/lib/auth/complete-entra-oauth-sign-in";
import {
  exchangeCodeForTokens,
  extractEmailFromIdToken,
  getAuthBaseUrl,
} from "@/lib/auth/entra";
import { oauthRedirect } from "@/lib/auth/oauth-http";
import { requirePersistenceForOAuth } from "@/lib/auth/require-user-persistence";
import { resolveRoleLanding } from "@/lib/auth/role-landing";
import { destroyTaskPilotSession, getTaskPilotSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

function redirectTo(path: string, search: string) {
  return oauthRedirect(new URL(`${path}${search}`, getAuthBaseUrl()));
}

function redirectLogin(detail: string) {
  return oauthRedirect(
    new URL(`/login?azdo_error=auth&detail=${detail}`, getAuthBaseUrl()),
  );
}

export async function GET(req: Request) {
  const gate = requirePersistenceForOAuth();
  if (!gate.ok) {
    const detail =
      gate.status === 503 ? "persistence_unavailable" : "microsoft_unavailable";
    return redirectLogin(detail);
  }

  const session = await getTaskPilotSession();
  const url = new URL(req.url);
  const err = url.searchParams.get("error");

  if (err) {
    session.pendingOAuth = undefined;
    await session.save();
    const detail = err === "access_denied" ? "cancelled" : "auth";
    return redirectLogin(detail);
  }

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  if (!code || !state) {
    session.pendingOAuth = undefined;
    await session.save();
    return redirectLogin("missing_code");
  }

  const pending = session.pendingOAuth;
  if (pending?.state !== state) {
    session.pendingOAuth = undefined;
    await session.save();
    return redirectLogin("invalid_state");
  }

  try {
    const tokens = await exchangeCodeForTokens({
      code,
      codeVerifier: pending.codeVerifier,
    });

    const refresh = tokens.refresh_token;
    if (!refresh) {
      session.pendingOAuth = undefined;
      await session.save();
      return redirectLogin("no_refresh_token_admin_consent");
    }

    const email = extractEmailFromIdToken(tokens.id_token);
    const selectedRole = pending.selectedRole;
    session.pendingOAuth = undefined;

    await completeEntraOAuthSignIn({
      session,
      refreshToken: refresh,
      accessToken: tokens.access_token,
      email,
      selectedRole,
    });

    await session.save();
    return redirectTo(resolveRoleLanding(session.userRole), "?azdo=connected");
  } catch (error) {
    if (error instanceof EntraSignInDisabledError) {
      await destroyTaskPilotSession().catch(() => undefined);
      return redirectLogin("account_disabled");
    }

    session.pendingOAuth = undefined;
    await session.save().catch(() => undefined);

    if (error instanceof EntraSignInIncompleteError) {
      return redirectLogin("incomplete_connection");
    }

    return redirectLogin("auth");
  }
}
