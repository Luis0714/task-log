import { cache } from "react";

import { getAzdoAuthMethod, type AzdoAuthMethod, type ConnectAuthOptions } from "@/lib/auth/auth-method";
import { getConnectAuthOptions } from "@/lib/auth/connect-auth-options";
import {
  emptyServerProfileFields,
  toServerProfileFields,
} from "@/lib/auth/profile-display";
import { resolveAdoProfile } from "@/lib/auth/resolve-ado-profile";
import { hasActiveUserSession } from "@/lib/auth/user-session";
import { getTaskPilotSession, isIronSessionConfigured } from "@/lib/auth/session";
import {
  isSessionPatReady,
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
  const oauthAppReady = connectOptions.oauthReady;

  let oauthConnected = false;
  let defaultOrg: string | null = null;
  let defaultProject: string | null = null;

  if (isIronSessionConfigured()) {
    const session = await getTaskPilotSession();
    oauthConnected = Boolean(session.azdoRefreshToken);
    defaultOrg = session.defaultOrg ?? null;
    defaultProject = session.defaultProject ?? null;
  }

  const userSessionActive = await hasActiveUserSession();
  const adoExecutionReady = await isAdoExecutionReady();
  const patConfigured =
    connectOptions.patReady && (await isSessionPatReady());
  const sessionConnected = userSessionActive && adoExecutionReady;

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
      sessionConnected && patConfigured ? defaultOrg : null,
    patProject: sessionConnected && patConfigured ? defaultProject : null,
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
