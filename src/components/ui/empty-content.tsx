import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

export type EmptyContentProps = ComponentProps<"div">;

export function EmptyContent({ className, ...props }: EmptyContentProps) {
  return (
    <div
      data-slot="empty-content"
      className={cn(
        "flex w-full max-w-sm min-w-0 flex-col items-center gap-2.5 text-sm text-balance",
        className,
      )}
      {...props}
    />
  );
}
