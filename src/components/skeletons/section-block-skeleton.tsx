import { CardBlockSkeleton } from "@/components/skeletons/card-block-skeleton";
import { DeliveryChartSkeleton } from "@/components/skeletons/delivery-chart-skeleton";
import { HoursChartSkeleton } from "@/components/skeletons/hours-chart-skeleton";
import { PbiListSkeleton } from "@/components/skeletons/pbi-list-skeleton";
import { WorkflowChartSkeleton } from "@/components/skeletons/workflow-chart-skeleton";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export type SectionBlockSkeletonProps = {
  content?: "list-compact" | "list-featured" | "chart" | "chart-delivery" | "chart-hours" | "chart-workflow" | "card";
  className?: string;
  /** Si false, solo pinta el contenido (útil dentro de DashboardSection con título real). */
  showHeader?: boolean;
};

export function SectionBlockSkeleton({
  content = "list-compact",
  className,
  showHeader = true,
}: SectionBlockSkeletonProps) {
  return (
    <section className={cn("flex flex-col gap-2", className)}>
      {showHeader ? (
        <div className="space-y-1.5">
          <Skeleton className="h-6 w-40 max-w-full sm:w-48" />
          <Skeleton className="h-4 w-full max-w-lg" />
        </div>
      ) : null}
      {content === "list-featured" ? <PbiListSkeleton variant="featured" /> : null}
      {content === "list-compact" ? <PbiListSkeleton variant="compact" /> : null}
      {content === "chart" ? <DeliveryChartSkeleton /> : null}
      {content === "chart-delivery" ? <DeliveryChartSkeleton /> : null}
      {content === "chart-hours" ? <HoursChartSkeleton /> : null}
      {content === "chart-workflow" ? <WorkflowChartSkeleton /> : null}
      {content === "card" ? <CardBlockSkeleton /> : null}
    </section>
  );
}
