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

export class EntraSignInDisabledError extends Error {
  constructor() {
    super("ENTRA_SIGNIN_DISABLED");
    this.name = "EntraSignInDisabledError";
  }
}

export type CompleteEntraOAuthInput = {
  session: TaskPilotSessionData;
  refreshToken: string;
  accessToken: string;
  selectedRole?: string;
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
  const { session, refreshToken, accessToken, selectedRole } = input;

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

  const { userId, roleName, isActive } = await entraUser.upsertOAuthUser({
    entraSubject: adoProfile.id,
    refreshToken,
    organization,
    project,
    displayName: adoProfile.displayName,
    adoProfileId: adoProfile.id,
    selectedRole,
  });

  if (!isActive) {
    throw new EntraSignInDisabledError();
  }

  await hydrateOAuthSession(session, {
    organization,
    project,
    taskPilotUserId: userId,
    adoProfile: profile,
    accessToken,
  });

  session.userRole = roleName ?? undefined;

  return {
    organization,
    project,
    profile,
    taskPilotUserId: userId,
  };
}
