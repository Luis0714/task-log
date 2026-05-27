"use client";

import { Cloud } from "lucide-react";

import {
  LogoutButton,
  ThemeToggleButton,
} from "@/components/connection/connection-sidebar-actions";
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

const TOOLTIP_TRIGGER_CLASS =
  "hover:bg-sidebar-accent flex size-9 items-center justify-center rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring";

function buildConnectionMetaLine(organization: string | null, authMethod: AdoConnectionDisplay["authMethod"]): string {
  const label = getAuthMethodLabel(authMethod).toLowerCase();
  if (!organization) return label;
  return `${organization.toLowerCase()} · ${label}`;
}

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

function CompactUserBadge({
  userDisplayName,
  userInitials,
  userAvatarUrl,
  tooltip,
}: Pick<AdoConnectionDisplay, "userDisplayName" | "userInitials" | "userAvatarUrl"> & {
  tooltip: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger className={TOOLTIP_TRIGGER_CLASS} aria-label={tooltip}>
        <ConnectionUserIdentity
          displayName={userDisplayName!}
          initials={userInitials!}
          avatarUrl={userAvatarUrl}
          compact
        />
      </TooltipTrigger>
      <TooltipContent side="right">{tooltip}</TooltipContent>
    </Tooltip>
  );
}

function CompactCloudBadge({
  isConnected,
  tooltip,
}: Pick<AdoConnectionDisplay, "isConnected"> & { tooltip: string }) {
  return (
    <Tooltip>
      <TooltipTrigger
        className={TOOLTIP_TRIGGER_CLASS}
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
      <CompactUserBadge
        userDisplayName={userDisplayName}
        userInitials={userInitials}
        userAvatarUrl={userAvatarUrl}
        tooltip={tooltip}
      />
    );
  }

  return <CompactCloudBadge isConnected={isConnected} tooltip={tooltip} />;
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
  const showUser = Boolean(isConnected && userDisplayName && userInitials);
  const metaLine = buildConnectionMetaLine(organization, authMethod);

  if (collapsed) {
    return (
      <div className={cn("flex flex-col items-center gap-2 py-1", className)}>
        <CompactConnectionBadge
          authMethod={authMethod}
          isConnected={isConnected}
          organization={organization}
          project={project}
          userDisplayName={userDisplayName}
          userInitials={userInitials}
          userAvatarUrl={userAvatarUrl}
        />
        <div className="flex items-center gap-0.5">
          <ThemeToggleButton />
          <LogoutButton />
        </div>
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
      {showUser && (
        <ConnectionUserIdentity
          displayName={userDisplayName!}
          initials={userInitials!}
          avatarUrl={userAvatarUrl}
        />
      )}

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
            <ConnectionStatus isConnected={isConnected} />
            <p className="text-muted-foreground text-xs">{metaLine}</p>
          </div>
          <div className="flex shrink-0 items-center gap-0.5">
            {!showUser && <ThemeToggleButton className="-mt-0.5" />}
            <LogoutButton className="-mt-0.5" />
          </div>
        </div>
      </div>
    </section>
  );
}
