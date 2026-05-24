"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  return (
    <div
      className={cn("flex min-w-0 items-center gap-2", className)}
      title={compact ? displayName : undefined}
    >
      <Avatar size={compact ? "sm" : "default"} className="shrink-0">
        {avatarUrl ? (
          <AvatarImage src={avatarUrl} alt={displayName} />
        ) : null}
        <AvatarFallback className="bg-sidebar-primary/15 text-sidebar-primary text-xs font-medium">
          {initials}
        </AvatarFallback>
      </Avatar>
      {!compact && (
        <p className="text-sidebar-foreground min-w-0 truncate text-sm font-medium">
          {displayName}
        </p>
      )}
    </div>
  );
}
