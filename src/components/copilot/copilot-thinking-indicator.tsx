"use client";

import { Bot } from "lucide-react";

import { cn } from "@/lib/utils";

type CopilotThinkingIndicatorProps = {
  label?: string;
  className?: string;
};

export function CopilotThinkingIndicator({ label, className }: Readonly<CopilotThinkingIndicatorProps>) {
  return (
    <div className={cn("flex gap-3", className)}>
      <div className="bg-muted text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-full">
        <Bot className="size-4" aria-hidden />
      </div>
      <div
        className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3"
        role="status"
        aria-live="polite"
      >
        {label ? (
          <p className="text-foreground text-sm" aria-label={label}>
            {label}
          </p>
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
