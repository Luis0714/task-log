import type { ReactNode } from "react";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type NoticeBannerProps = Readonly<{
  icon?: ReactNode;
  children: ReactNode;
  action?: ReactNode;
  onDismiss?: () => void;
  dismissLabel?: string;
  /** inline: texto y acciones en una sola fila (p. ej. avisos cortos en móvil). */
  layout?: "stack" | "inline";
  className?: string;
}>;

export function NoticeBanner({
  icon,
  children,
  action,
  onDismiss,
  dismissLabel = "Cerrar",
  layout = "stack",
  className,
}: NoticeBannerProps) {
  const isInline = layout === "inline";

  return (
    <output
      className={cn(
        "bg-card flex rounded-lg border px-3 py-3",
        isInline
          ? "flex-row items-center justify-between gap-2"
          : "flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <div
        className={cn(
          "flex min-w-0 gap-2 text-sm",
          isInline ? "items-center" : "items-start",
        )}
      >
        {icon}
        <div className="min-w-0 flex-1">{children}</div>
      </div>
      {action || onDismiss ? (
        <div
          className={cn(
            "flex shrink-0 items-center gap-2",
            isInline ? "self-center" : "self-end sm:self-center",
          )}
        >
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
    </output>
  );
}
