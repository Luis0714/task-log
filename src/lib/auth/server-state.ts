import { getAzdoAuthMethod, type AzdoAuthMethod } from "@/lib/auth/auth-method";
import { isEntraOAuthConfigured } from "@/lib/auth/entra";
import { getTaskPilotSession, isIronSessionConfigured } from "@/lib/auth/session";
import { fetchCurrentAdoProfile } from "@/lib/azure-devops/profile";
import {
  getPatTargetFromEnv,
  isPatConfigured,
  resolveAdoCaller,
} from "@/lib/azure-devops/resolve-auth";
import { isAdoExecutionReady } from "@/lib/azure-devops/work-items";
import { getUserInitials } from "@/lib/auth/user-display";

export type ServerAuthState = {
  authMethod: AzdoAuthMethod;
  oauthAppReady: boolean;
  oauthConnected: boolean;
  profileDisplayName: string | null;
  profileInitials: string | null;
  profileAvatarUrl: string | null;
  defaultOrg: string | null;
  defaultProject: string | null;
  adoExecutionReady: boolean;
  patConfigured: boolean;
  patOrganization: string | null;
  patProject: string | null;
};

export async function getServerAuthState(): Promise<ServerAuthState> {
  const authMethod = getAzdoAuthMethod();
  const patTarget = getPatTargetFromEnv();
  const oauthEnabled = authMethod === "oauth";
  const patEnabled = authMethod === "pat";

  const oauthAppReady =
    oauthEnabled && isEntraOAuthConfigured() && isIronSessionConfigured();

  let oauthConnected = false;
  let profileDisplayName: string | null = null;
  let defaultOrg: string | null = null;
  let defaultProject: string | null = null;

  if (oauthEnabled && isIronSessionConfigured()) {
    const session = await getTaskPilotSession();
    oauthConnected = Boolean(session.azdoRefreshToken);
    profileDisplayName = session.adoProfile?.displayName ?? null;
    defaultOrg = session.defaultOrg ?? null;
    defaultProject = session.defaultProject ?? null;
  }

  const patConfigured = patEnabled && isPatConfigured();
  const adoExecutionReady = await isAdoExecutionReady();

  let profileInitials: string | null = profileDisplayName
    ? getUserInitials(profileDisplayName)
    : null;
  let profileAvatarUrl: string | null = null;

  if (adoExecutionReady) {
    const caller = await resolveAdoCaller();
    if (caller) {
      const liveProfile = await fetchCurrentAdoProfile(caller);
      if (liveProfile) {
        profileDisplayName = liveProfile.displayName;
        profileInitials = getUserInitials(liveProfile.displayName);
        profileAvatarUrl = "/api/ado/profile/avatar";
      }
    }
  }

  return {
    authMethod,
    oauthAppReady,
    oauthConnected,
    profileDisplayName,
    profileInitials,
    profileAvatarUrl,
    defaultOrg,
    defaultProject,
    adoExecutionReady,
    patConfigured,
    patOrganization: patEnabled ? (patTarget?.organization ?? null) : null,
    patProject: patEnabled ? (patTarget?.project ?? null) : null,
  };
}

