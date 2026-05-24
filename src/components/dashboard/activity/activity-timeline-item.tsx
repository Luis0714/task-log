import { ArrowRightLeft, Clock } from "lucide-react";

import type { DashboardActivityItem } from "@/lib/dashboard/activity";
import { formatRelativeTime } from "@/lib/dashboard/activity";
import { cn } from "@/lib/utils";

export type ActivityTimelineItemProps = {
  item: DashboardActivityItem;
  className?: string;
};

export function ActivityTimelineItem({ item, className }: ActivityTimelineItemProps) {
  const Icon = item.type === "state_change" ? ArrowRightLeft : Clock;

  return (
    <li className={cn("relative flex gap-3 pb-4 last:pb-0", className)}>
      <span className="bg-primary/15 text-primary mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full">
        <Icon className="size-3.5" aria-hidden />
      </span>
      <div className="min-w-0 flex-1 pt-0.5">
        <p className="text-muted-foreground text-xs">{formatRelativeTime(item.at)}</p>
        <p className="text-foreground mt-0.5 text-sm leading-snug">{item.description}</p>
      </div>
    </li>
  );
}
