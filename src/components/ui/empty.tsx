import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

export type EmptyProps = ComponentProps<"div">;

export function Empty({ className, ...props }: EmptyProps) {
  return (
    <div
      data-slot="empty"
      className={cn(
        "flex w-full min-w-0 flex-1 flex-col items-center justify-center gap-4 rounded-xl border border-dashed p-6 text-center text-balance",
        className,
      )}
      {...props}
    />
  );
}
