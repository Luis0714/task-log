import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export type IconCountProps = {
  icon: ReactNode;
  count: number;
  label: string;
  className?: string;
};

export function IconCount({ icon, count, label, className }: IconCountProps) {
  return (
    <span
      className={cn(
        "text-muted-foreground inline-flex items-center gap-1 text-[11px] tabular-nums",
        className,
      )}
      title={label}
    >
      <span className="inline-flex size-3 shrink-0 items-center [&>svg]:size-3" aria-hidden>
        {icon}
      </span>
      {count}
    </span>
  );
}
