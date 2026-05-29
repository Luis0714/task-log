import { Cloud } from "lucide-react";

import { ConnectSignInTrigger } from "@/components/auth/connect-sign-in-trigger";
import { ConnectionBadgeToolbar } from "@/components/connection/connection-badge-toolbar";
import { ConnectionStatusBadge } from "@/components/connection/connection-status-badge";
import { ConnectionUserIdentity } from "@/components/connection/connection-user-identity";
import { buildConnectionMetaLine } from "@/lib/auth/connection-display-labels";
import type { AdoConnectionDisplay } from "@/lib/auth/connection-display";
import { cn } from "@/lib/utils";

export type ConnectionBadgeExpandedProps = AdoConnectionDisplay & {
  className?: string;
};

export function ConnectionBadgeExpanded({
  authMethod,
  isConnected,
  canLogout,
  connectOptions,
  showSignIn,
  organization,
  userDisplayName,
  userInitials,
  userAvatarUrl,
  className,
}: ConnectionBadgeExpandedProps) {
  const showUser = Boolean(isConnected && userDisplayName && userInitials);
  const metaLine = buildConnectionMetaLine(organization, authMethod, isConnected);

  return (
    <section
      aria-label="Conexión con Azure DevOps"
      className={cn(
        "border-sidebar-border bg-sidebar-accent/25 flex flex-col gap-2.5 rounded-lg border p-3",
        className,
      )}
    >
      {showUser ? (
        <ConnectionUserIdentity
          displayName={userDisplayName!}
          initials={userInitials!}
          avatarUrl={userAvatarUrl}
        />
      ) : null}

      <div
        className={cn(
          "flex min-w-0 items-start gap-2.5",
          showUser && "border-sidebar-border border-t pt-2.5",
        )}
      >
        <div
          className="bg-sidebar-primary/15 text-sidebar-primary flex size-9 shrink-0 items-center justify-center rounded-lg"
          aria-hidden
        >
          <Cloud className="size-4" />
        </div>
        <div className="flex min-w-0 flex-1 items-start justify-between gap-2">
          <div className="flex min-w-0 flex-col gap-0.5">
            <ConnectionStatusBadge isConnected={isConnected} />
            <p className="text-muted-foreground text-xs">{metaLine}</p>
          </div>
          <ConnectionBadgeToolbar
            canLogout={canLogout}
            showThemeToggle={!showUser}
          />
        </div>
      </div>

      {showSignIn ? (
        <ConnectSignInTrigger connectOptions={connectOptions} fullWidth />
      ) : null}
    </section>
  );
}
