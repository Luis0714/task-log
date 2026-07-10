import { cache } from "react";

import { getAzdoAuthMethod, type AzdoAuthMethod, type ConnectAuthOptions } from "@/lib/auth/auth-method";
import { getConnectAuthOptions } from "@/lib/auth/connect-auth-options";
import { isManagementRole } from "@/lib/auth/management-roles";
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
import { getRepositories, isUserPersistenceReady } from "@/lib/db";

export type ServerAuthProfileFields = {
  profileDisplayName: string | null;
  profileInitials: string | null;
  profileAvatarUrl: string | null;
};

export type SavedConnectionTarget = {
  organization: string;
  project: string;
  team?: string;
};

export type ServerAuthBootstrap = {
  authMethod: AzdoAuthMethod;
  connectOptions: ConnectAuthOptions;
  oauthAppReady: boolean;
  oauthConnected: boolean;
  defaultOrg: string | null;
  defaultProject: string | null;
  savedConnectionTarget: SavedConnectionTarget | null;
  adoExecutionReady: boolean;
  patConfigured: boolean;
  patOrganization: string | null;
  patProject: string | null;
  userSessionActive: boolean;
  userRole: string | null;
  isAdmin: boolean;
  isManagement: boolean;
};

export type ServerAuthState = ServerAuthBootstrap & ServerAuthProfileFields;

async function resolveSavedTargetFromSession(): Promise<{
  defaultOrg: string | null;
  defaultProject: string | null;
  savedConnectionTarget: SavedConnectionTarget | null;
  oauthConnected: boolean;
}> {
  if (!isIronSessionConfigured()) {
    return {
      defaultOrg: null,
      defaultProject: null,
      savedConnectionTarget: null,
      oauthConnected: false,
    };
  }

  const session = await getTaskPilotSession();
  const userId = session.taskPilotUserId?.trim();

  if (userId && isUserPersistenceReady()) {
    try {
      const connection = await getRepositories().adoConnection.loadByUserId(userId);
      if (connection) {
        const team = connection.team?.trim();
        return {
          defaultOrg: connection.organization,
          defaultProject: connection.project,
          savedConnectionTarget: {
            organization: connection.organization,
            project: connection.project,
            ...(team ? { team } : {}),
          },
          oauthConnected: connection.authMethod === "oauth",
        };
      }
    } catch {
      // Sin conexión usable en BD.
    }
  }

  const organization = session.defaultOrg?.trim();
  const project = session.defaultProject?.trim();
  const team = session.defaultTeam?.trim();

  return {
    defaultOrg: organization ?? null,
    defaultProject: project ?? null,
    savedConnectionTarget:
      organization && project
        ? {
            organization,
            project,
            ...(team ? { team } : {}),
          }
        : null,
    oauthConnected: session.sessionAuthMethod === "oauth",
  };
}

export const getServerAuthBootstrap = cache(async function getServerAuthBootstrap(): Promise<ServerAuthBootstrap> {
  const authMethod = getAzdoAuthMethod();
  const connectOptions = getConnectAuthOptions();
  const oauthAppReady = connectOptions.oauthReady;

  const saved = await resolveSavedTargetFromSession();
  const userSessionActive = await hasActiveUserSession();
  const adoExecutionReady = await isAdoExecutionReady();
  const patConfigured =
    connectOptions.patReady && (await isSessionPatReady());
  const sessionConnected = userSessionActive && adoExecutionReady;

  let userRole: string | null = null;
  if (isIronSessionConfigured()) {
    const session = await getTaskPilotSession();
    userRole = session.userRole ?? null;
  }
  const isAdmin = userRole === "super_admin";
  const isManagement = isManagementRole(userRole);

  return {
    authMethod,
    connectOptions,
    oauthAppReady,
    oauthConnected: sessionConnected && saved.oauthConnected,
    defaultOrg: sessionConnected ? saved.defaultOrg : null,
    defaultProject: sessionConnected ? saved.defaultProject : null,
    savedConnectionTarget: sessionConnected ? saved.savedConnectionTarget : null,
    adoExecutionReady,
    patConfigured,
    patOrganization:
      sessionConnected && patConfigured ? saved.defaultOrg : null,
    patProject: sessionConnected && patConfigured ? saved.defaultProject : null,
    userSessionActive,
    userRole,
    isAdmin,
    isManagement,
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
