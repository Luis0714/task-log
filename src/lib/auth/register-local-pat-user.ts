import "server-only";

import { hydratePatSession } from "@/lib/auth/hydrate-pat-session";
import { validatePatConnection } from "@/lib/auth/validate-pat-connection";
import { createLocalPatUser } from "@/lib/db/repositories/local-user.repository";
import { fetchCurrentAdoProfile } from "@/lib/azure-devops/profile";
import { getTaskPilotSession } from "@/lib/auth/session";
import type { ConnectPatBody } from "@/lib/schemas/connect-pat";
import {
  generateLocalCredentials,
  hashPassword,
} from "@/lib/security";

const MAX_USERNAME_ATTEMPTS = 5;

export type RegisterLocalPatSuccess = {
  ok: true;
  username: string;
  password: string;
};

export type RegisterLocalPatFailure = {
  ok: false;
  message: string;
};

export type RegisterLocalPatResult =
  | RegisterLocalPatSuccess
  | RegisterLocalPatFailure;

function isUniqueUsernameError(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.message.includes("users_username_unique") ||
      error.message.includes("duplicate key"))
  );
}

export async function registerLocalPatUser(
  input: ConnectPatBody,
): Promise<RegisterLocalPatResult> {
  const { pat, organization, project, team } = input;
  const trimmedTeam = team?.trim();

  const validation = await validatePatConnection({ organization, project, pat });
  if (!validation.ok) {
    return { ok: false, message: validation.message };
  }

  const caller = {
    mode: "pat" as const,
    organization,
    project,
    pat,
  };
  const profile = await fetchCurrentAdoProfile(caller);

  for (let attempt = 0; attempt < MAX_USERNAME_ATTEMPTS; attempt++) {
    const credentials = generateLocalCredentials();
    const passwordHash = await hashPassword(credentials.password);

    try {
      const { userId } = await createLocalPatUser({
        username: credentials.username,
        passwordHash,
        organization,
        project,
        team: trimmedTeam,
        pat,
        adoProfileId: profile?.id,
        displayName: profile?.displayName,
      });

      const session = await getTaskPilotSession();
      await hydratePatSession(session, {
        pat,
        organization,
        project,
        team: trimmedTeam,
        taskPilotUserId: userId,
      });
      await session.save();

      return {
        ok: true,
        username: credentials.username,
        password: credentials.password,
      };
    } catch (error) {
      if (isUniqueUsernameError(error) && attempt < MAX_USERNAME_ATTEMPTS - 1) {
        continue;
      }
      throw error;
    }
  }

  return {
    ok: false,
    message: "No pudimos crear tu cuenta. Inténtalo de nuevo en unos segundos.",
  };
}
