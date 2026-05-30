import "server-only";

import { hydratePatSession } from "@/lib/auth/hydrate-pat-session";
import { getRepositories } from "@/lib/db";
import { getTaskPilotSession } from "@/lib/auth/session";
import type { LoginLocalBody } from "@/lib/schemas/login-local";
import { USER_MESSAGES } from "@/lib/errors/user-messages";
import { verifyPassword } from "@/lib/security";

export type LoginLocalSuccess = { ok: true };

export type LoginLocalFailure = {
  ok: false;
  message: string;
  reason?: "invalid_credentials" | "user_not_found" | "microsoft_account";
};

export type LoginLocalResult = LoginLocalSuccess | LoginLocalFailure;

export async function loginLocalUser(
  input: LoginLocalBody,
): Promise<LoginLocalResult> {
  const { localUser, adoConnection } = getRepositories();
  const record = await localUser.findWithPatConnection(input.email);

  if (!record) {
    return {
      ok: false,
      reason: "user_not_found",
      message: USER_MESSAGES.invalidCredentials,
    };
  }

  const passwordValid = await verifyPassword(
    input.password,
    record.passwordHash,
  );
  if (!passwordValid) {
    return {
      ok: false,
      reason: "invalid_credentials",
      message: USER_MESSAGES.invalidCredentials,
    };
  }

  const connection = await adoConnection.loadByUserId(record.userId);
  if (!connection || connection.authMethod !== "pat") {
    return {
      ok: false,
      message: USER_MESSAGES.microsoftUnavailable,
      reason: "microsoft_account",
    };
  }

  const session = await getTaskPilotSession();
  await hydratePatSession(session, {
    pat: connection.pat,
    organization: connection.organization,
    project: connection.project,
    team: connection.team ?? undefined,
    taskPilotUserId: record.userId,
  });
  await session.save();

  return { ok: true };
}
