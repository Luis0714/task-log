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
  email?: string | null;
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
  const { session, refreshToken, accessToken, email, selectedRole } = input;

  const adoProfile = await fetchAdoProfile(accessToken);
  const profile: AdoProfileSession = adoProfile;
  const accounts = await listAdoAccounts(accessToken, adoProfile.id);
  const detectedOrganization = accounts[0]?.accountName?.trim() || null;
  const detectedProject = detectedOrganization
    ? (await pickDefaultProject(accessToken, detectedOrganization))?.trim() || null
    : null;

  const { entraUser } = getRepositories();

  // Si el usuario ya existe, SIEMPRE respetamos su conexión persistida
  // (incluyendo project/team predeterminados). El detectedProject solo se usa
  // como fallback cuando es la primera conexión.
  const existing = await entraUser.findWithOAuthConnection(adoProfile.id);

  const organization = existing?.organization ?? detectedOrganization;
  const project = existing?.project ?? detectedProject;

  if (!organization || !project) {
    throw new EntraSignInIncompleteError();
  }

  const { userId, roleName, isActive } = await entraUser.upsertOAuthUser({
    entraSubject: adoProfile.id,
    refreshToken,
    organization,
    project,
    displayName: adoProfile.displayName,
    email: email ?? undefined,
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
