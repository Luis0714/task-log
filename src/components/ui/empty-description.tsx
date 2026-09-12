import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

export type EmptyDescriptionProps = ComponentProps<"p">;

export function EmptyDescription({ className, ...props }: EmptyDescriptionProps) {
  return (
    <div
      data-slot="empty-description"
      className={cn(
        "text-muted-foreground text-sm/relaxed [&>a]:underline [&>a]:underline-offset-4 [&>a:hover]:text-primary",
        className,
      )}
      {...props}
    />
  );
}
