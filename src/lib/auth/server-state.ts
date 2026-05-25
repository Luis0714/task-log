import { cache } from "react";

import { getAzdoAuthMethod, type AzdoAuthMethod } from "@/lib/auth/auth-method";
import { isEntraOAuthConfigured } from "@/lib/auth/entra";
import { getTaskPilotSession, isIronSessionConfigured } from "@/lib/auth/session";
import {
  emptyServerProfileFields,
  toServerProfileFields,
} from "@/lib/auth/profile-display";
import { resolveAdoProfile } from "@/lib/auth/resolve-ado-profile";
import {
  getPatTargetFromEnv,
  isPatConfigured,
  resolveAdoCaller,
} from "@/lib/azure-devops/resolve-auth";
import { isAdoExecutionReady } from "@/lib/azure-devops/work-items";

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

export const getServerAuthState = cache(async function getServerAuthState(): Promise<ServerAuthState> {
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

  const caller = adoExecutionReady ? await resolveAdoCaller() : null;
  const profile = caller ? await resolveAdoProfile(caller) : null;
  const profileFields = profile ? toServerProfileFields(profile) : emptyServerProfileFields;

  return {
    authMethod,
    oauthAppReady,
    oauthConnected,
    ...profileFields,
    defaultOrg,
    defaultProject,
    adoExecutionReady,
    patConfigured,
    patOrganization: patEnabled ? (patTarget?.organization ?? null) : null,
    patProject: patEnabled ? (patTarget?.project ?? null) : null,
  };
});

