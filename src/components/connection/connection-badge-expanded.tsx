import { Building2, ShieldCheck } from "lucide-react";

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
  savedConnectionTarget,
  showSignIn,
  organization,
  userDisplayName,
  userInitials,
  userAvatarUrl,
  userRole,
  className,
}: ConnectionBadgeExpandedProps) {
  const showUser = Boolean(isConnected && userDisplayName && userInitials);
  const { organization: metaOrg, role: metaRole } = buildConnectionMetaLine(
    organization,
    authMethod,
    isConnected,
    userRole,
  );
  const hasMeta = Boolean(metaRole || metaOrg);
  const showInlineToolbar = !showUser && canLogout;

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

      {showUser ? (
        <div className="border-sidebar-border border-t" aria-hidden />
      ) : null}

      {/* Estado de la conexión */}
      <div className="flex min-w-0 items-center gap-2">
        <div className="flex min-w-0 flex-1 items-center">
          <ConnectionStatusBadge isConnected={isConnected} />
        </div>
        {showInlineToolbar ? (
          <ConnectionBadgeToolbar
            canLogout={canLogout}
            showThemeToggle={true}
            className="flex items-center gap-0.5"
          />
        ) : null}
      </div>

      {/* Rol y organización con chips consistentes */}
      {hasMeta ? (
        <ul className="space-y-1.5">
          {metaRole ? (
            <li className="flex min-w-0 items-center">
              <span className="text-sidebar-primary inline-flex w-fit max-w-full items-center gap-1 rounded-md border border-sidebar-primary/25 bg-sidebar-primary/10 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide">
                <ShieldCheck className="size-3 shrink-0" aria-hidden />
                <span className="min-w-0 truncate">{metaRole}</span>
              </span>
            </li>
          ) : null}
          {metaOrg ? (
            <li className="flex min-w-0 items-center">
              <span
                className="text-sidebar-primary inline-flex w-fit max-w-full items-center gap-1 rounded-md border border-sidebar-primary/25 bg-sidebar-primary/10 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide"
                title={metaOrg}
              >
                <Building2 className="size-3 shrink-0" aria-hidden />
                <span className="min-w-0 truncate">{metaOrg}</span>
              </span>
            </li>
          ) : null}
        </ul>
      ) : null}

      {/* Acciones (logout) cuando el usuario está identificado */}
      {showUser && canLogout ? (
        <div className="border-sidebar-border flex items-center justify-end gap-1 border-t pt-2">
          <ConnectionBadgeToolbar
            canLogout={canLogout}
            showThemeToggle={false}
            className="flex items-center gap-0.5"
          />
        </div>
      ) : null}

      {showSignIn ? (
        <ConnectSignInTrigger
          connectOptions={connectOptions}
          savedConnectionTarget={savedConnectionTarget}
          fullWidth
        />
      ) : null}
    </section>
  );
}
