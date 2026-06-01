import type { LucideIcon } from "lucide-react";

import { progressRingToneClass } from "@/components/dashboard/metrics/progress-ring/progress-ring-tone";
import type { ProgressRingBreakdownItem } from "@/lib/dashboard/progress-ring/types";

export type ProgressRingBreakdownRowProps = {
  item: ProgressRingBreakdownItem;
  icon: LucideIcon;
};

export function ProgressRingBreakdownRow({ item, icon: Icon }: ProgressRingBreakdownRowProps) {
  return (
    <li className="flex items-center justify-between gap-2 text-[11px] sm:text-xs">
      <span className="text-muted-foreground flex items-center gap-1.5">
        <Icon className={progressRingToneClass(item.tone)} aria-hidden />
        {item.label}
      </span>
      <span className="font-heading font-semibold tabular-nums">{item.count}</span>
    </li>
  );
}
