"use client";

import { Cloud } from "lucide-react";

import { ConnectionUserIdentity } from "@/components/connection/connection-user-identity";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { buildCompactConnectionTooltip } from "@/lib/auth/connection-display-labels";
import type { AdoConnectionDisplay } from "@/lib/auth/connection-display";
import { cn } from "@/lib/utils";

const TOOLTIP_TRIGGER_CLASS =
  "hover:bg-sidebar-accent flex size-9 items-center justify-center rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring";

type CompactConnectionBadgeProps = Pick<
  AdoConnectionDisplay,
  | "authMethod"
  | "isConnected"
  | "userDisplayName"
  | "userInitials"
  | "userAvatarUrl"
>;

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

export function CompactConnectionBadge({
  isConnected,
  authMethod,
  userDisplayName,
  userInitials,
  userAvatarUrl,
}: CompactConnectionBadgeProps) {
  const tooltip = buildCompactConnectionTooltip(
    isConnected,
    authMethod,
    userDisplayName,
  );

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
