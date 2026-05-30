import "server-only";

import {
  fetchAdoProfile,
  listAdoAccounts,
  pickDefaultProject,
} from "@/lib/auth/entra";
import {
  hydrateOAuthSession,
  type AdoProfileSession,
} from "@/lib/auth/hydrate-oauth-session";
import { getRepositories } from "@/lib/db";
import type { TaskPilotSessionData } from "@/lib/auth/session";

export class EntraSignInIncompleteError extends Error {
  constructor() {
    super("ENTRA_SIGNIN_INCOMPLETE");
    this.name = "EntraSignInIncompleteError";
  }
}

export type CompleteEntraOAuthInput = {
  session: TaskPilotSessionData;
  refreshToken: string;
  accessToken: string;
};

export type CompleteEntraOAuthResult = {
  organization: string;
  project: string;
  profile: AdoProfileSession;
  taskPilotUserId: string;
};

export async function completeEntraOAuthSignIn(
  input: CompleteEntraOAuthInput,
): Promise<CompleteEntraOAuthResult> {
  const { session, refreshToken, accessToken } = input;

  const adoProfile = await fetchAdoProfile(accessToken);
  const profile: AdoProfileSession = adoProfile;
  const accounts = await listAdoAccounts(accessToken, adoProfile.id);
  let organization = accounts[0]?.accountName?.trim() || null;
  let project = organization
    ? (await pickDefaultProject(accessToken, organization))?.trim() || null
    : null;

  const { entraUser } = getRepositories();

  if (!organization || !project) {
    const existing = await entraUser.findWithOAuthConnection(adoProfile.id);
    if (existing) {
      organization = organization ?? existing.organization;
      project = project ?? existing.project;
    }
  }

  if (!organization || !project) {
    throw new EntraSignInIncompleteError();
  }

  const { userId } = await entraUser.upsertOAuthUser({
    entraSubject: adoProfile.id,
    refreshToken,
    organization,
    project,
    displayName: adoProfile.displayName,
    adoProfileId: adoProfile.id,
  });

  await hydrateOAuthSession(session, {
    organization,
    project,
    taskPilotUserId: userId,
    adoProfile: profile,
    accessToken,
  });

  return {
    organization,
    project,
    profile,
    taskPilotUserId: userId,
  };
}
