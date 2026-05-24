import { getAzdoAuthMethod, type AzdoAuthMethod } from "@/lib/auth/auth-method";
import { isEntraOAuthConfigured } from "@/lib/auth/entra";
import { getTaskPilotSession, isIronSessionConfigured } from "@/lib/auth/session";
import { isAdoExecutionReady } from "@/lib/azure-devops/work-items";
import { getPatTargetFromEnv, isPatConfigured } from "@/lib/azure-devops/resolve-auth";

export type ServerAuthState = {
  authMethod: AzdoAuthMethod;
  oauthAppReady: boolean;
  oauthConnected: boolean;
  profileDisplayName: string | null;
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

  return {
    authMethod,
    oauthAppReady,
    oauthConnected,
    profileDisplayName,
    defaultOrg,
    defaultProject,
    adoExecutionReady,
    patConfigured,
    patOrganization: patEnabled ? (patTarget?.organization ?? null) : null,
    patProject: patEnabled ? (patTarget?.project ?? null) : null,
  };
}

