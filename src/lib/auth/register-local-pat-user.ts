import "server-only";

import { hydratePatSession } from "@/lib/auth/hydrate-pat-session";
import { validatePatConnection } from "@/lib/auth/validate-pat-connection";
import { createLocalPatUser } from "@/lib/db/repositories/local-user.repository";
import { fetchCurrentAdoProfile } from "@/lib/azure-devops/profile";
import { getTaskPilotSession } from "@/lib/auth/session";
import type { RegisterPatBody } from "@/lib/schemas/register-pat";
import { hashPassword } from "@/lib/security";

export type RegisterLocalPatSuccess = {
  ok: true;
};

export type RegisterLocalPatFailure = {
  ok: false;
  message: string;
};

export type RegisterLocalPatResult =
  | RegisterLocalPatSuccess
  | RegisterLocalPatFailure;

function isDuplicateEmailError(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.message.includes("users_username_unique") ||
      error.message.includes("duplicate key"))
  );
}

export async function registerLocalPatUser(
  input: RegisterPatBody,
): Promise<RegisterLocalPatResult> {
  const { pat, organization, project, team, email, password } = input;
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
  const passwordHash = await hashPassword(password);

  try {
    const { userId } = await createLocalPatUser({
      email,
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

    return { ok: true };
  } catch (error) {
    if (isDuplicateEmailError(error)) {
      return {
        ok: false,
        message:
          "Ese correo ya está registrado. Inicia sesión o usa otro correo.",
      };
    }
    throw error;
  }
}
