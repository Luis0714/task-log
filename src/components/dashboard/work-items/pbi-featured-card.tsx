import { ProgressBar } from "@/components/dashboard/metrics/progress-bar";
import { WorkItemHoursLabel } from "@/components/work-items/work-item-hours-label";
import { WorkItemId } from "@/components/work-items/work-item-id";
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
        <WorkItemId id={item.id} />
        {item.state ? <WorkItemStateBadge state={item.state} className="max-w-none" /> : null}
      </div>

      <div className="mt-3 flex min-w-0 items-start gap-3">
        <WorkItemTypeAvatar type={item.type} />
        <div className="min-w-0 flex-1">
          <p
            className="text-foreground line-clamp-2 text-[15px] leading-snug font-semibold"
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
        <div className="mt-4 space-y-1.5">
          <ProgressBar value={item.loggedHours!} max={item.estimatedHours!} />
          <p className="text-muted-foreground text-xs tabular-nums">
            Progreso estimado · {item.loggedHours}h de {item.estimatedHours}h
          </p>
        </div>
      ) : null}
    </>
  );

  const cardClassName = cn(
    "flex w-full min-w-0 flex-col rounded-xl border border-border/60 bg-card p-4 shadow-sm",
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
