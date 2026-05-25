"use client";

import { ThemeToggleButton } from "@/components/connection/connection-sidebar-actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getShortDisplayName } from "@/lib/auth/user-display";
import { cn } from "@/lib/utils";

export type ConnectionUserIdentityProps = {
  displayName: string;
  initials: string;
  avatarUrl?: string | null;
  compact?: boolean;
  className?: string;
};

export function ConnectionUserIdentity({
  displayName,
  initials,
  avatarUrl,
  compact = false,
  className,
}: ConnectionUserIdentityProps) {
  const shortDisplayName = getShortDisplayName(displayName);

  return (
    <div
      className={cn(
        "flex min-w-0 items-center gap-2",
        !compact && "justify-between",
        className,
      )}
      title={compact ? displayName : undefined}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <Avatar size={compact ? "sm" : "default"} className="shrink-0">
          {avatarUrl ? (
            <AvatarImage src={avatarUrl} alt={displayName} />
          ) : null}
          <AvatarFallback className="bg-sidebar-primary/15 text-sidebar-primary text-xs font-medium">
            {initials}
          </AvatarFallback>
        </Avatar>
        {!compact && (
          <p
            className="text-sidebar-foreground min-w-0 truncate text-sm font-medium"
            title={displayName}
          >
            {shortDisplayName}
          </p>
        )}
      </div>
      {!compact ? <ThemeToggleButton /> : null}
    </div>
  );
}
