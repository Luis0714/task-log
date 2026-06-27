"use client";

import {
  Bot,
  CheckCircle2,
  Save,
  Search,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

import type { ThinkingIconKind } from "@/lib/schemas/conversation";
import { cn } from "@/lib/utils";

type CopilotThinkingIndicatorProps = {
  label?: string;
  iconKind?: ThinkingIconKind | string;
  className?: string;
};

const ICON_BY_KIND: Record<string, LucideIcon> = {
  thinking: Sparkles,
  search: Search,
  found: CheckCircle2,
  logging: Save,
};

export function CopilotThinkingIndicator({
  label,
  iconKind,
  className,
}: Readonly<CopilotThinkingIndicatorProps>) {
  const Icon = iconKind ? ICON_BY_KIND[iconKind] : undefined;
  const AvatarIcon: LucideIcon = Icon ?? Bot;

  return (
    <div className={cn("flex gap-3", className)}>
      <div className="bg-muted text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-full">
        <AvatarIcon className="size-4" aria-hidden />
      </div>
      <div
        className="bg-muted flex items-center gap-2 rounded-2xl rounded-tl-sm px-4 py-3"
        role="status"
        aria-live="polite"
      >
        {label ? (
          <>
            {Icon ? (
              <Icon
                className="text-muted-foreground size-3.5 shrink-0"
                aria-hidden
              />
            ) : null}
            <p className="text-foreground text-sm">{label}</p>
          </>
        ) : (
          <div className="flex items-center gap-1.5">
            <span className="bg-muted-foreground/50 size-1.5 animate-bounce rounded-full [animation-delay:0ms]" />
            <span className="bg-muted-foreground/50 size-1.5 animate-bounce rounded-full [animation-delay:150ms]" />
            <span className="bg-muted-foreground/50 size-1.5 animate-bounce rounded-full [animation-delay:300ms]" />
          </div>
        )}
      </div>
    </div>
  );
}
