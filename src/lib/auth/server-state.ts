import { cache } from "react";

import { getAzdoAuthMethod, type AzdoAuthMethod, type ConnectAuthOptions } from "@/lib/auth/auth-method";
import { getConnectAuthOptions } from "@/lib/auth/connect-auth-options";
import { isEntraOAuthConfigured } from "@/lib/auth/entra";
import {
  emptyServerProfileFields,
  toServerProfileFields,
} from "@/lib/auth/profile-display";
import { resolveAdoProfile } from "@/lib/auth/resolve-ado-profile";
import { hasActiveUserSession } from "@/lib/auth/user-session";
import { getTaskPilotSession, isIronSessionConfigured } from "@/lib/auth/session";
import {
  getPatTargetFromEnv,
  isPatConfigured,
  resolveAdoCaller,
} from "@/lib/azure-devops/resolve-auth";
import { isAdoExecutionReady } from "@/lib/azure-devops/work-items";

export type ServerAuthProfileFields = {
  profileDisplayName: string | null;
  profileInitials: string | null;
  profileAvatarUrl: string | null;
};

export type ServerAuthBootstrap = {
  authMethod: AzdoAuthMethod;
  connectOptions: ConnectAuthOptions;
  oauthAppReady: boolean;
  oauthConnected: boolean;
  defaultOrg: string | null;
  defaultProject: string | null;
  adoExecutionReady: boolean;
  patConfigured: boolean;
  patOrganization: string | null;
  patProject: string | null;
  userSessionActive: boolean;
};

export type ServerAuthState = ServerAuthBootstrap & ServerAuthProfileFields;

export const getServerAuthBootstrap = cache(async function getServerAuthBootstrap(): Promise<ServerAuthBootstrap> {
  const authMethod = getAzdoAuthMethod();
  const connectOptions = getConnectAuthOptions();
  const patTarget = getPatTargetFromEnv();
  const oauthEnabled = authMethod === "oauth" || authMethod === "both";
  const patEnabled = authMethod === "pat";

  const oauthAppReady =
    oauthEnabled && isEntraOAuthConfigured() && isIronSessionConfigured();

  let oauthConnected = false;
  let defaultOrg: string | null = null;
  let defaultProject: string | null = null;

  let sessionOrg: string | null = null;
  let sessionProject: string | null = null;

  if (isIronSessionConfigured()) {
    const session = await getTaskPilotSession();
    oauthConnected = Boolean(session.azdoRefreshToken);
    sessionOrg = session.defaultOrg ?? null;
    sessionProject = session.defaultProject ?? null;
    defaultOrg = sessionOrg;
    defaultProject = sessionProject;
  }

  const patConfigured = patEnabled && isPatConfigured();
  const patOrganization =
    patConfigured && patTarget
      ? patTarget.organization
      : sessionOrg;
  const patProject =
    patConfigured && patTarget ? patTarget.project : sessionProject;
  const adoExecutionReady = await isAdoExecutionReady();
  const userSessionActive = await hasActiveUserSession();

  const sessionConnected = adoExecutionReady && userSessionActive;

  return {
    authMethod,
    connectOptions,
    oauthAppReady,
    oauthConnected,
    defaultOrg: sessionConnected ? defaultOrg : null,
    defaultProject: sessionConnected ? defaultProject : null,
    adoExecutionReady,
    patConfigured,
    patOrganization:
      sessionConnected && (patEnabled || authMethod === "both") ? patOrganization : null,
    patProject:
      sessionConnected && (patEnabled || authMethod === "both") ? patProject : null,
    userSessionActive,
  };
});

export const getServerAuthProfile = cache(async function getServerAuthProfile(): Promise<ServerAuthProfileFields> {
  const bootstrap = await getServerAuthBootstrap();

  if (!bootstrap.userSessionActive) {
    return emptyServerProfileFields;
  }

  const caller = await resolveAdoCaller();
  const profile = caller ? await resolveAdoProfile(caller) : null;

  return profile ? toServerProfileFields(profile) : emptyServerProfileFields;
});

export const getServerAuthState = cache(async function getServerAuthState(): Promise<ServerAuthState> {
  const [bootstrap, profile] = await Promise.all([
    getServerAuthBootstrap(),
    getServerAuthProfile(),
  ]);

  return { ...bootstrap, ...profile };
});
