import "server-only";

import { fetchAdoProfile, refreshAccessToken } from "@/lib/auth/entra";
import { hydrateOAuthSession } from "@/lib/auth/hydrate-oauth-session";
import { hydratePatSession } from "@/lib/auth/hydrate-pat-session";
import { resolveRoleLanding } from "@/lib/auth/role-landing";
import { getTaskPilotSession } from "@/lib/auth/session";
import { SUPER_ADMIN_ROLE } from "@/lib/auth/super-admin-role";
import {
  isSuperAdminUnlockConfigured,
  resolveSuperAdminEmail,
  verifySuperAdminPassword,
} from "@/lib/auth/super-admin-password";
import { getRepositories } from "@/lib/db";
import type { LoginSuperAdminBody } from "@/lib/schemas/login-super-admin";
import { USER_MESSAGES } from "@/lib/errors/user-messages";

export type LoginSuperAdminSuccess = { ok: true; landing: string };

export type LoginSuperAdminFailure = {
  ok: false;
  message: string;
  reason?: "invalid_credentials" | "connection_missing" | "token_expired";
};

export type LoginSuperAdminResult =
  | LoginSuperAdminSuccess
  | LoginSuperAdminFailure;

export async function loginSuperAdmin(
  input: LoginSuperAdminBody,
): Promise<LoginSuperAdminResult> {
  if (!isSuperAdminUnlockConfigured()) {
    return invalidCredentials();
  }

  const passwordValid = await verifySuperAdminPassword(input.password);
  if (!passwordValid) {
    return invalidCredentials();
  }

  const { user, adoConnection, entraUser } = getRepositories();
  const admin = await user.findActiveSuperAdmin(resolveSuperAdminEmail());
  if (!admin) {
    return invalidCredentials();
  }

  const connection = await adoConnection.loadByUserId(admin.userId);
  if (!connection) {
    return {
      ok: false,
      reason: "connection_missing",
      message: USER_MESSAGES.superAdminConnectionMissing,
    };
  }

  const session = await getTaskPilotSession();

  if (connection.authMethod === "pat") {
    await hydratePatSession(session, {
      pat: connection.pat,
      organization: connection.organization,
      project: connection.project,
      team: connection.team ?? undefined,
      taskPilotUserId: admin.userId,
    });
  } else {
    try {
      const tokens = await refreshAccessToken(connection.refreshToken);
      if (tokens.refresh_token) {
        await entraUser.updateOAuthRefreshToken(
          admin.userId,
          tokens.refresh_token,
        );
      }

      const adoProfile = await fetchAdoProfile(tokens.access_token).catch(
        () => undefined,
      );

      await hydrateOAuthSession(session, {
        organization: connection.organization,
        project: connection.project,
        team: connection.team ?? undefined,
        taskPilotUserId: admin.userId,
        adoProfile,
        accessToken: tokens.access_token,
      });
    } catch {
      return {
        ok: false,
        reason: "token_expired",
        message: USER_MESSAGES.superAdminTokenExpired,
      };
    }
  }

  session.userRole = SUPER_ADMIN_ROLE;
  await session.save();

  return { ok: true, landing: resolveRoleLanding(SUPER_ADMIN_ROLE) };
}

function invalidCredentials(): LoginSuperAdminFailure {
  return {
    ok: false,
    reason: "invalid_credentials",
    message: USER_MESSAGES.invalidCredentials,
  };
}
