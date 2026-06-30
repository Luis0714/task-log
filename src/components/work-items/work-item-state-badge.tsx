"use client";

import { usePbiStateColors } from "@/hooks/use-pbi-state-colors";
import { cn } from "@/lib/utils";

export type WorkItemStateBadgeProps = {
  state: string;
  className?: string;
};

export function WorkItemStateBadge({ state, className }: WorkItemStateBadgeProps) {
  const { category, badgeStyle, dotStyle } = usePbiStateColors(state);

  return (
    <span
      data-pbi-state={category}
      style={badgeStyle}
      className={cn(
        "inline-flex min-w-0 max-w-[58%] shrink items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium",
        className,
      )}
    >
      <span
        className="size-1.5 shrink-0 rounded-full"
        style={dotStyle}
        aria-hidden
      />
      <span className="truncate">{state}</span>
    </span>
  );
}
