"use client";

import { Cloud } from "lucide-react";

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
        className="border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
      >
        <span className="size-1.5 rounded-full bg-emerald-400" aria-hidden />
        Conectado
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="border-border text-muted-foreground">
      <span className="bg-muted-foreground size-1.5 rounded-full" aria-hidden />
      Sin conectar
    </Badge>
  );
}

function CompactConnectionBadge(props: AdoConnectionDisplay) {
  const {
    isConnected,
    organization,
    project,
    authMethod,
    userDisplayName,
    userInitials,
    userAvatarUrl,
  } = props;
  const label = [organization, project].filter(Boolean).join(" / ") || "Sin configurar";
  const status = isConnected ? "Conectado" : "Sin conectar";
  const tooltip = userDisplayName
    ? `${userDisplayName} · ${label} · ${status}`
    : `${label} · ${status}`;

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
        aria-label={`Azure DevOps: ${label}. ${status}. ${getAuthMethodLabel(authMethod)}`}
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
      <TooltipContent side="right">{`${label} · ${status}`}</TooltipContent>
    </Tooltip>
  );
}

export function AdoConnectionBadge({
  authMethod,
  isConnected,
  organization,
  project,
  userDisplayName,
  userInitials,
  userAvatarUrl,
  className,
}: AdoConnectionBadgeProps) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const hasTarget = Boolean(organization?.trim() && project?.trim());
  const showUser = Boolean(isConnected && userDisplayName && userInitials);

  if (collapsed) {
    return (
      <div className={cn("flex justify-center py-1", className)}>
        <CompactConnectionBadge
          authMethod={authMethod}
          isConnected={isConnected}
          organization={organization}
          project={project}
          userDisplayName={userDisplayName}
          userInitials={userInitials}
          userAvatarUrl={userAvatarUrl}
        />
      </div>
    );
  }

  return (
    <section
      aria-label="Conexión con Azure DevOps"
      className={cn(
        "border-sidebar-border bg-sidebar-accent/25 flex flex-col gap-2 rounded-lg border p-3",
        className,
      )}
    >
      <div className="flex gap-3">
        <div
          className="bg-sidebar-primary/15 text-sidebar-primary flex size-9 shrink-0 items-center justify-center rounded-lg"
          aria-hidden
        >
          <Cloud className="size-4" />
        </div>

        <div className="flex min-w-0 flex-1 items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sidebar-foreground/55 text-[0.65rem] font-medium tracking-wide uppercase">
              Azure DevOps
            </p>
            {hasTarget ? (
              <p className="text-sidebar-foreground truncate text-sm font-medium">
                {organization}
                <span className="text-sidebar-foreground/45 mx-1 font-normal">/</span>
                {project}
              </p>
            ) : (
              <p className="text-muted-foreground text-sm">Org y proyecto no configurados</p>
            )}
            <p className="text-muted-foreground mt-0.5 text-xs">{getAuthMethodLabel(authMethod)}</p>
          </div>
          <ConnectionStatus isConnected={isConnected} />
        </div>
      </div>

      {showUser && (
        <ConnectionUserIdentity
          displayName={userDisplayName!}
          initials={userInitials!}
          avatarUrl={userAvatarUrl}
        />
      )}
    </section>
  );
}
