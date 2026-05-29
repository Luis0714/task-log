import { isSignInUiOffered } from "@/lib/auth/auth-method";
import type { SavedConnectionTarget, ServerAuthState } from "@/lib/auth/server-state";

export type { AzdoAuthMethod, ConnectAuthOptions } from "@/lib/auth/auth-method";
export {
  buildConnectionMetaLine,
  getAuthMethodLabel,
} from "@/lib/auth/connection-display-labels";

export type AdoConnectionDisplay = {
  authMethod: ServerAuthState["authMethod"];
  isConnected: boolean;
  canLogout: boolean;
  connectOptions: ServerAuthState["connectOptions"];
  savedConnectionTarget: SavedConnectionTarget | null;
  showSignIn: boolean;
  organization: string | null;
  project: string | null;
  userDisplayName: string | null;
  userInitials: string | null;
  userAvatarUrl: string | null;
};

export function mapAuthStateToConnectionDisplay(
  auth: ServerAuthState,
): AdoConnectionDisplay {
  const organization = auth.defaultOrg ?? auth.patOrganization;
  const project = auth.defaultProject ?? auth.patProject;
  const signedIn = auth.userSessionActive;

  return {
    authMethod: auth.authMethod,
    isConnected: signedIn,
    canLogout: signedIn,
    connectOptions: auth.connectOptions,
    savedConnectionTarget: auth.savedConnectionTarget,
    showSignIn: !signedIn && isSignInUiOffered(),
    organization: signedIn ? organization : null,
    project: signedIn ? project : null,
    userDisplayName: signedIn ? auth.profileDisplayName : null,
    userInitials: signedIn ? auth.profileInitials : null,
    userAvatarUrl: signedIn ? auth.profileAvatarUrl : null,
  };
}
