import "server-only";

import { hydratePatSession } from "@/lib/auth/hydrate-pat-session";
import { findLocalUserWithPatConnection } from "@/lib/db/repositories/local-user.repository";
import { getTaskPilotSession } from "@/lib/auth/session";
import type { LoginLocalBody } from "@/lib/schemas/login-local";
import { USER_MESSAGES } from "@/lib/errors/user-messages";
import { decryptAdoSecrets, verifyPassword } from "@/lib/security";

export type LoginLocalSuccess = { ok: true };

export type LoginLocalFailure = {
  ok: false;
  message: string;
  reason?: "invalid_credentials" | "microsoft_account";
};

export type LoginLocalResult = LoginLocalSuccess | LoginLocalFailure;

export async function loginLocalUser(
  input: LoginLocalBody,
): Promise<LoginLocalResult> {
  const username = input.username.trim();
  const record = await findLocalUserWithPatConnection(username);

  if (!record) {
    return {
      ok: false,
      reason: "invalid_credentials",
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

  const secrets = decryptAdoSecrets(record.encryptedSecrets);
  if (secrets.kind !== "pat") {
    return {
      ok: false,
      message: USER_MESSAGES.microsoftUnavailable,
      reason: "microsoft_account",
    };
  }

  const session = await getTaskPilotSession();
  await hydratePatSession(session, {
    pat: secrets.pat,
    organization: record.organization,
    project: record.project,
    team: record.team ?? undefined,
    taskPilotUserId: record.userId,
  });
  await session.save();

  return { ok: true };
}
