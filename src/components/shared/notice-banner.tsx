import type { ReactNode } from "react";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type NoticeBannerProps = {
  icon?: ReactNode;
  children: ReactNode;
  action?: ReactNode;
  onDismiss?: () => void;
  dismissLabel?: string;
  className?: string;
};

export function NoticeBanner({
  icon,
  children,
  action,
  onDismiss,
  dismissLabel = "Cerrar",
  className,
}: NoticeBannerProps) {
  return (
    <div
      role="status"
      className={cn(
        "bg-card flex flex-col gap-3 rounded-lg border px-3 py-3 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <div className="flex min-w-0 items-start gap-2 text-sm">
        {icon}
        <div className="min-w-0 flex-1">{children}</div>
      </div>
      {action || onDismiss ? (
        <div className="flex shrink-0 items-center gap-2 self-end sm:self-center">
          {action}
          {onDismiss ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={onDismiss}
              aria-label={dismissLabel}
            >
              <X />
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
