import "server-only";

import { attachProcessProfileOnConnect } from "@/lib/azure-devops/persist-process-profile";
import { fetchCurrentAdoProfile } from "@/lib/azure-devops/profile";
import type { TaskPilotSessionData } from "@/lib/auth/session";
import { clearSessionCredentials } from "@/lib/auth/session";

export type PatSessionInput = {
  pat: string;
  organization: string;
  project: string;
  team?: string;
  taskPilotUserId?: string;
};

export async function hydratePatSession(
  session: TaskPilotSessionData,
  input: PatSessionInput,
): Promise<void> {
  const organization = input.organization.trim();
  const project = input.project.trim();
  const pat = input.pat.trim();
  const trimmedTeam = input.team?.trim();

  clearSessionCredentials(session);
  session.sessionAuthMethod = "pat";
  session.azdoPat = pat;
  session.defaultOrg = organization;
  session.defaultProject = project;
  session.defaultTeam = trimmedTeam || undefined;
  if (input.taskPilotUserId) {
    session.taskPilotUserId = input.taskPilotUserId;
  }

  const caller = { mode: "pat" as const, organization, project, pat };
  const profile = await fetchCurrentAdoProfile(caller);
  if (profile) {
    session.adoProfile = profile;
  }

  try {
    await attachProcessProfileOnConnect(session, caller);
  } catch {
    // La conexión PAT sigue siendo válida aunque falle la detección del perfil de proceso.
  }
}
