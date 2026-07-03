import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Small monospaced keyboard key indicator — used in the Neos IA footer to
 * hint at the Ctrl+Enter shortcut, and anywhere else we want to surface a
 * keyboard shortcut inline with text.
 */
function Kbd({ className, ...props }: React.ComponentProps<"kbd">) {
  return (
    <kbd
      data-slot="kbd"
      className={cn(
        "pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

export { Kbd };
