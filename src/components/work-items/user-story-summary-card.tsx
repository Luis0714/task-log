import { UserRound } from "lucide-react";

import { WorkItemEffortBadge } from "@/components/work-items/work-item-effort-badge";
import { WorkItemId } from "@/components/work-items/work-item-id";
import { WorkItemStateBadge } from "@/components/work-items/work-item-state-badge";
import type { AdoWorkItemOptionDto } from "@/lib/schemas/ado-catalog";
import { cn } from "@/lib/utils";

export type UserStorySummaryCardProps = {
  item: AdoWorkItemOptionDto;
  className?: string;
};

export function UserStorySummaryCard({ item, className }: UserStorySummaryCardProps) {
  return (
    <div
      className={cn(
        "shrink-0 rounded-xl border border-border/60 bg-card p-4 shadow-sm",
        "dark:border-white/6 dark:bg-card/90",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <WorkItemId id={item.id} />
          {item.effort !== undefined ? <WorkItemEffortBadge effort={item.effort} /> : null}
        </div>
        {item.state ? <WorkItemStateBadge state={item.state} className="max-w-[50%] shrink-0" /> : null}
      </div>

      {item.assignedTo ? (
        <div className="mt-3 flex min-w-0 items-center gap-2.5">
          <span className="bg-primary/15 text-primary flex size-8 shrink-0 items-center justify-center rounded-lg border border-primary/25">
            <UserRound className="size-4" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-muted-foreground text-[10px] leading-none font-semibold tracking-widest uppercase">
              Asignado a
            </p>
            <p
              className="text-foreground mt-1 text-sm leading-tight"
              title={item.assignedTo}
            >
              {item.assignedTo}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
