import { ProgressBar } from "@/components/dashboard/metrics/progress-bar";
import { WorkItemBugCountBadge } from "@/components/work-items/work-item-bug-count-badge";
import { WorkItemEffortBadge } from "@/components/work-items/work-item-effort-badge";
import { WorkItemHoursLabel } from "@/components/work-items/work-item-hours-label";
import { WorkItemId } from "@/components/work-items/work-item-id";
import { WorkItemPriorityBadge } from "@/components/work-items/work-item-priority-badge";
import { WorkItemStateBadge } from "@/components/work-items/work-item-state-badge";
import { WorkItemTypeAvatar } from "@/components/work-items/work-item-type-avatar";
import type { DashboardWorkItem } from "@/lib/dashboard/types";
import { cn } from "@/lib/utils";

export type PbiFeaturedCardProps = {
  item: DashboardWorkItem;
  className?: string;
  onClick?: () => void;
};

export function PbiFeaturedCard({ item, className, onClick }: PbiFeaturedCardProps) {
  const hasProgress =
    item.loggedHours !== undefined &&
    item.estimatedHours !== undefined &&
    item.estimatedHours > 0;

  const content = (
    <>
      <div className="flex min-w-0 items-start justify-between gap-2">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <WorkItemId id={item.id} className="shrink-0" />
          {item.priority !== undefined ? (
            <WorkItemPriorityBadge priority={item.priority} />
          ) : null}
          {item.effort !== undefined ? <WorkItemEffortBadge effort={item.effort} /> : null}
          {item.bugCount !== undefined && item.bugCount > 0 ? (
            <WorkItemBugCountBadge count={item.bugCount} variant="total" />
          ) : null}
          {item.attendedBugCount !== undefined && item.attendedBugCount > 0 ? (
            <WorkItemBugCountBadge count={item.attendedBugCount} variant="attended" />
          ) : null}
        </div>
        {item.state ? <WorkItemStateBadge state={item.state} className="shrink" /> : null}
      </div>

      <div className="mt-3 flex min-w-0 items-start gap-2.5 sm:gap-3">
        <WorkItemTypeAvatar type={item.type} className="shrink-0" />
        <div className="min-w-0 flex-1">
          <p
            className="text-foreground line-clamp-2 text-sm leading-snug font-semibold sm:text-[15px]"
            title={item.title}
          >
            {item.title}
          </p>
          {item.loggedHours !== undefined ? (
            <WorkItemHoursLabel hours={item.loggedHours} className="mt-2 block" />
          ) : null}
        </div>
      </div>

      {hasProgress ? (
        <div className="mt-4 min-w-0 space-y-1.5">
          <ProgressBar value={item.loggedHours!} max={item.estimatedHours!} />
          <p className="text-muted-foreground text-pretty text-xs tabular-nums">
            Progreso estimado · {item.loggedHours}h de {item.estimatedHours}h
          </p>
        </div>
      ) : null}
    </>
  );

  const cardClassName = cn(
    "flex w-full min-w-0 flex-col rounded-xl border border-border/60 bg-card p-3 shadow-sm sm:p-4",
    "dark:border-white/6 dark:bg-card/90",
    "transition-colors hover:border-primary/25 hover:bg-card/95",
    onClick && "cursor-pointer",
    className,
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={cn(cardClassName, "text-left")}>
        {content}
      </button>
    );
  }

  return <article className={cardClassName}>{content}</article>;
}
