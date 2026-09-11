import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

export type EmptyTitleProps = ComponentProps<"div">;

export function EmptyTitle({ className, ...props }: EmptyTitleProps) {
  return (
    <div
      data-slot="empty-title"
      className={cn("font-heading text-sm font-medium tracking-tight", className)}
      {...props}
    />
  );
}
