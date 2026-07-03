import { UserRound } from "lucide-react";

import { TaskDateBadge } from "@/components/tasks/task-date-badge";
import { AdoWorkItemLink } from "@/components/work-items/ado-work-item-link";
import { WorkItemStateBadge } from "@/components/work-items/work-item-state-badge";
import { formatHours } from "@/lib/dashboard/format-hours";
import type { AdoWorkItemOptionDto } from "@/lib/schemas/ado-catalog";
import { cn } from "@/lib/utils";

export type BugSummaryCardProps = {
  item: AdoWorkItemOptionDto;
  project: string | null;
  className?: string;
};

function BugLoggedHoursBadge({ hours }: { hours: number }) {
  if (!Number.isFinite(hours) || hours < 0) return null;

  return (
    <span
      className="inline-flex shrink-0 items-center rounded-full border border-amber-500/25 bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-900 tabular-nums dark:text-amber-300"
      title={`Trabajo completado: ${formatHours(hours)}`}
    >
      {formatHours(hours)}
    </span>
  );
}

export function BugSummaryCard({ item, project, className }: BugSummaryCardProps) {
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
          <AdoWorkItemLink workItemId={item.id} project={project} label={`#${item.id}`} />
          {item.workingDate ? <TaskDateBadge dateKey={item.workingDate} /> : null}
          {item.loggedHours !== undefined ? (
            <BugLoggedHoursBadge hours={item.loggedHours} />
          ) : null}
        </div>
        {item.state ? <WorkItemStateBadge state={item.state} className="max-w-[50%] shrink-0" /> : null}
      </div>

      {item.parentId ? (
        <p className="text-muted-foreground mt-3 flex flex-wrap items-center gap-1.5 text-xs">
          <span>Historia padre:</span>
          <AdoWorkItemLink
            workItemId={item.parentId}
            project={project}
            label={`HU #${item.parentId}`}
          />
        </p>
      ) : null}

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
