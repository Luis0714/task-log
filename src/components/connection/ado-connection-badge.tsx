"use client";

import { Cloud } from "lucide-react";

import { ConnectionSidebarActions } from "@/components/connection/connection-sidebar-actions";
import { ConnectionUserIdentity } from "@/components/connection/connection-user-identity";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useSidebar } from "@/components/ui/sidebar";
import {
  getAuthMethodLabel,
  type AdoConnectionDisplay,
} from "@/lib/auth/connection-display";
import { cn } from "@/lib/utils";

export type AdoConnectionBadgeProps = AdoConnectionDisplay & {
  className?: string;
};

function ConnectionStatus({ isConnected }: { isConnected: boolean }) {
  if (isConnected) {
    return (
      <Badge
        variant="outline"
        className="border-emerald-500/30 bg-emerald-500/10 shrink-0 text-emerald-400"
      >
        <span className="size-1.5 rounded-full bg-emerald-400" aria-hidden />
        Conectado
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="border-border shrink-0 text-muted-foreground">
      <span className="bg-muted-foreground size-1.5 rounded-full" aria-hidden />
      Sin conectar
    </Badge>
  );
}

function CompactConnectionBadge({
  isConnected,
  authMethod,
  userDisplayName,
  userInitials,
  userAvatarUrl,
}: AdoConnectionDisplay) {
  const status = isConnected ? "Conectado" : "Sin conectar";
  const tooltip = userDisplayName
    ? `${userDisplayName} · ${status}`
    : `${status} · ${getAuthMethodLabel(authMethod)}`;

  if (isConnected && userDisplayName && userInitials) {
    return (
      <Tooltip>
        <TooltipTrigger
          className="hover:bg-sidebar-accent flex size-9 items-center justify-center rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
          aria-label={tooltip}
        >
          <ConnectionUserIdentity
            displayName={userDisplayName}
            initials={userInitials}
            avatarUrl={userAvatarUrl}
            compact
          />
        </TooltipTrigger>
        <TooltipContent side="right">{tooltip}</TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger
        className="hover:bg-sidebar-accent flex size-9 items-center justify-center rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
        aria-label={`Azure DevOps · ${tooltip}`}
      >
        <span className="relative">
          <Cloud className="text-sidebar-primary size-4" aria-hidden />
          <span
            className={cn(
              "absolute -top-0.5 -right-0.5 size-2 rounded-full ring-2 ring-sidebar",
              isConnected ? "bg-emerald-400" : "bg-muted-foreground",
            )}
            aria-hidden
          />
        </span>
      </TooltipTrigger>
      <TooltipContent side="right">{tooltip}</TooltipContent>
    </Tooltip>
  );
}

export function AdoConnectionBadge({
  authMethod,
  isConnected,
  canLogout,
  userDisplayName,
  userInitials,
  userAvatarUrl,
  className,
  ...rest
}: AdoConnectionBadgeProps) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const showUser = Boolean(isConnected && userDisplayName && userInitials);
  const displayProps: AdoConnectionDisplay = {
    authMethod,
    isConnected,
    canLogout,
    userDisplayName,
    userInitials,
    userAvatarUrl,
    organization: rest.organization,
    project: rest.project,
  };

  if (collapsed) {
    return (
      <div className={cn("flex flex-col items-center gap-2 py-1", className)}>
        <CompactConnectionBadge {...displayProps} />
        <ConnectionSidebarActions showLogout={canLogout} className="justify-center border-t-0 pt-0" />
      </div>
    );
  }

  return (
    <section
      aria-label="Conexión con Azure DevOps"
      className={cn(
        "border-sidebar-border bg-sidebar-accent/25 flex flex-col gap-2.5 rounded-lg border p-3",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <div
            className="bg-sidebar-primary/15 text-sidebar-primary flex size-9 shrink-0 items-center justify-center rounded-lg"
            aria-hidden
          >
            <Cloud className="size-4" />
          </div>
          <div className="min-w-0">
            <p className="text-sidebar-foreground text-sm font-medium">Azure DevOps</p>
            <p className="text-muted-foreground text-xs">{getAuthMethodLabel(authMethod)}</p>
          </div>
        </div>
        <ConnectionStatus isConnected={isConnected} />
      </div>

      {showUser ? (
        <ConnectionUserIdentity
          displayName={userDisplayName!}
          initials={userInitials!}
          avatarUrl={userAvatarUrl}
          className="border-sidebar-border border-t pt-2.5"
        />
      ) : null}

      <ConnectionSidebarActions showLogout={canLogout} />
    </section>
  );
}
