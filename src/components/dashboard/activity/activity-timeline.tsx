import { ActivityTimelineItem } from "@/components/dashboard/activity/activity-timeline-item";
import { Skeleton } from "@/components/ui/skeleton";
import type { DashboardActivityItem } from "@/lib/dashboard/activity";
import { cn } from "@/lib/utils";

export type ActivityTimelineProps = {
  items: DashboardActivityItem[];
  loading?: boolean;
  emptyMessage?: string;
  className?: string;
};

export function ActivityTimeline({
  items,
  loading = false,
  emptyMessage = "Aún no hay actividad reciente.",
  className,
}: ActivityTimelineProps) {
  if (loading) {
    return (
      <div className={cn("space-y-3", className)}>
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-5/6" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <p className="text-muted-foreground rounded-lg border border-dashed px-4 py-8 text-center text-sm">
        {emptyMessage}
      </p>
    );
  }

  return (
    <ol className={cn("border-border/60 relative border-l pl-4", className)}>
      {items.map((item) => (
        <ActivityTimelineItem key={item.id} item={item} />
      ))}
    </ol>
  );
}
