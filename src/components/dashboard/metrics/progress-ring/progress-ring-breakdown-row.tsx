import type { LucideIcon } from "lucide-react";

import { progressRingToneClass } from "@/components/dashboard/metrics/progress-ring/progress-ring-tone";
import type { ProgressRingBreakdownItem } from "@/lib/dashboard/progress-ring/types";
import { cn } from "@/lib/utils";

export type ProgressRingBreakdownRowProps = {
  item: ProgressRingBreakdownItem;
  icon: LucideIcon;
};

export function ProgressRingBreakdownRow({ item, icon: Icon }: ProgressRingBreakdownRowProps) {
  return (
    <li className="flex min-w-0 items-center justify-between gap-2 text-[11px] sm:text-xs">
      <span className="text-muted-foreground flex min-w-0 flex-1 items-center gap-1.5">
        <Icon className={cn("size-3.5 shrink-0 sm:size-4", progressRingToneClass(item.tone))} aria-hidden />
        <span className="truncate">{item.label}</span>
      </span>
      <span className="font-heading font-semibold tabular-nums">{item.count}</span>
    </li>
  );
}
