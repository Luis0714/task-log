import type { AzdoAuthMethod } from "@/lib/auth/auth-method";
import type { ServerAuthState } from "@/lib/auth/server-state";

export type AdoConnectionDisplay = {
  authMethod: AzdoAuthMethod;
  isConnected: boolean;
  organization: string | null;
  project: string | null;
  userDisplayName: string | null;
  userInitials: string | null;
  userAvatarUrl: string | null;
};

export function mapAuthStateToConnectionDisplay(
  auth: ServerAuthState,
): AdoConnectionDisplay {
  const organization =
    auth.authMethod === "pat" ? auth.patOrganization : auth.defaultOrg;
  const project = auth.authMethod === "pat" ? auth.patProject : auth.defaultProject;

  return {
    authMethod: auth.authMethod,
    isConnected: auth.adoExecutionReady,
    organization,
    project,
    userDisplayName: auth.profileDisplayName,
    userInitials: auth.profileInitials,
    userAvatarUrl: auth.profileAvatarUrl,
  };
}

export function getAuthMethodLabel(authMethod: AzdoAuthMethod): string {
  return authMethod === "pat" ? "PAT en servidor" : "OAuth";
}
