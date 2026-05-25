import { UserRound } from "lucide-react";

import { TaskDateBadge } from "@/components/tasks/task-date-badge";
import { WorkItemEffortBadge } from "@/components/work-items/work-item-effort-badge";
import { WorkItemId } from "@/components/work-items/work-item-id";
import { StatusBadge } from "@/components/tasks/status-badge";
import { formatHours } from "@/lib/dashboard/format-hours";
import type { AdoWorkItemOptionDto } from "@/lib/schemas/ado-catalog";
import { cn } from "@/lib/utils";

export type TaskSummaryCardProps = {
  item: AdoWorkItemOptionDto;
  className?: string;
};

function TaskLoggedHoursBadge({ hours }: { hours: number }) {
  if (!Number.isFinite(hours) || hours < 0) return null;

  return (
    <span
      className="inline-flex shrink-0 items-center rounded-full border border-amber-500/25 bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-900 tabular-nums dark:text-amber-300"
      title={`Horas registradas: ${formatHours(hours)}`}
    >
      {formatHours(hours)}
    </span>
  );
}

export function TaskSummaryCard({ item, className }: TaskSummaryCardProps) {
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
          {item.workingDate ? <TaskDateBadge dateKey={item.workingDate} /> : null}
          {item.effort !== undefined ? <WorkItemEffortBadge effort={item.effort} /> : null}
          {item.loggedHours !== undefined ? (
            <TaskLoggedHoursBadge hours={item.loggedHours} />
          ) : null}
        </div>
        {item.state ? <StatusBadge state={item.state} className="max-w-[50%] shrink-0" /> : null}
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
