import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

export type EmptyHeaderProps = ComponentProps<"div">;

export function EmptyHeader({ className, ...props }: EmptyHeaderProps) {
  return (
    <div
      data-slot="empty-header"
      className={cn("flex max-w-sm flex-col items-center gap-2", className)}
      {...props}
    />
  );
}
