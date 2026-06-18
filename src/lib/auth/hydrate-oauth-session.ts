import "server-only";

import { attachProcessProfileOnConnect } from "@/lib/azure-devops/persist-process-profile";
import { applyContextDefaultsToSession } from "@/lib/auth/apply-context-defaults-to-session";
import type { TaskPilotSessionData } from "@/lib/auth/session";
import { clearSessionCredentials } from "@/lib/auth/session";

export type AdoProfileSession = {
  displayName: string;
  publicAlias?: string;
  id: string;
};

export type OAuthSessionInput = {
  organization: string;
  project: string;
  team?: string;
  taskPilotUserId: string;
  adoProfile?: AdoProfileSession;
  accessToken?: string;
};

export async function hydrateOAuthSession(
  session: TaskPilotSessionData,
  input: OAuthSessionInput,
): Promise<void> {
  const organization = input.organization.trim();
  const project = input.project.trim();
  const trimmedTeam = input.team?.trim();

  clearSessionCredentials(session);
  session.sessionAuthMethod = "oauth";
  session.taskPilotUserId = input.taskPilotUserId;
  session.defaultOrg = organization;
  session.defaultProject = project;
  session.defaultTeam = trimmedTeam || undefined;
  if (input.adoProfile) {
    session.adoProfile = input.adoProfile;
  }

  await applyContextDefaultsToSession(session);

  if (input.accessToken) {
    try {
      await attachProcessProfileOnConnect(session, {
        mode: "oauth",
        accessToken: input.accessToken,
        organization,
        project,
      });
    } catch {
      // OAuth sigue válido; el perfil se resolverá en la primera carga del proyecto.
    }
  }
}