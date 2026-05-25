import { cache } from "react";

import { getAzdoAuthMethod, type AzdoAuthMethod } from "@/lib/auth/auth-method";
import { isEntraOAuthConfigured } from "@/lib/auth/entra";
import {
  emptyServerProfileFields,
  toServerProfileFields,
} from "@/lib/auth/profile-display";
import { resolveAdoProfile } from "@/lib/auth/resolve-ado-profile";
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
  oauthAppReady: boolean;
  oauthConnected: boolean;
  defaultOrg: string | null;
  defaultProject: string | null;
  adoExecutionReady: boolean;
  patConfigured: boolean;
  patOrganization: string | null;
  patProject: string | null;
};

export type ServerAuthState = ServerAuthBootstrap & ServerAuthProfileFields;

export const getServerAuthBootstrap = cache(async function getServerAuthBootstrap(): Promise<ServerAuthBootstrap> {
  const authMethod = getAzdoAuthMethod();
  const patTarget = getPatTargetFromEnv();
  const oauthEnabled = authMethod === "oauth";
  const patEnabled = authMethod === "pat";

  const oauthAppReady =
    oauthEnabled && isEntraOAuthConfigured() && isIronSessionConfigured();

  let oauthConnected = false;
  let defaultOrg: string | null = null;
  let defaultProject: string | null = null;

  if (oauthEnabled && isIronSessionConfigured()) {
    const session = await getTaskPilotSession();
    oauthConnected = Boolean(session.azdoRefreshToken);
    defaultOrg = session.defaultOrg ?? null;
    defaultProject = session.defaultProject ?? null;
  }

  const patConfigured = patEnabled && isPatConfigured();
  const adoExecutionReady = await isAdoExecutionReady();

  return {
    authMethod,
    oauthAppReady,
    oauthConnected,
    defaultOrg,
    defaultProject,
    adoExecutionReady,
    patConfigured,
    patOrganization: patEnabled ? (patTarget?.organization ?? null) : null,
    patProject: patEnabled ? (patTarget?.project ?? null) : null,
  };
});

export const getServerAuthProfile = cache(async function getServerAuthProfile(): Promise<ServerAuthProfileFields> {
  const bootstrap = await getServerAuthBootstrap();

  if (!bootstrap.adoExecutionReady) {
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
