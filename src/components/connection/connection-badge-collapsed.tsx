import { ConnectSignInTrigger } from "@/components/auth/connect-sign-in-trigger";
import { CompactConnectionBadge } from "@/components/connection/compact-connection-badge";
import { ThemeToggleButton } from "@/components/connection/connection-sidebar-actions";
import { LogoutButton } from "@/components/connection/logout-button";
import type { AdoConnectionDisplay } from "@/lib/auth/connection-display";
import { cn } from "@/lib/utils";

export type ConnectionBadgeCollapsedProps = AdoConnectionDisplay & {
  className?: string;
};

export function ConnectionBadgeCollapsed({
  className,
  showSignIn,
  connectOptions,
  savedConnectionTarget,
  canLogout,
  ...badgeProps
}: ConnectionBadgeCollapsedProps) {
  return (
    <div className={cn("flex flex-col items-center gap-2 py-1", className)}>
      <CompactConnectionBadge {...badgeProps} />
      <div className="flex flex-col items-center gap-1">
        <ThemeToggleButton />
        {canLogout ? <LogoutButton /> : null}
      </div>
      {showSignIn ? (
        <ConnectSignInTrigger
          connectOptions={connectOptions}
          savedConnectionTarget={savedConnectionTarget}
          fullWidth
          iconOnly
        />
      ) : null}
    </div>
  );
}
