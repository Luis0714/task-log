import { PbiListSkeleton } from "@/components/skeletons/pbi-list-skeleton";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export type SectionBlockSkeletonProps = {
  content?: "list-compact" | "list-featured" | "chart" | "chart-delivery" | "chart-hours" | "chart-workflow" | "card";
  className?: string;
  /** Si false, solo pinta el contenido (útil dentro de DashboardSection con título real). */
  showHeader?: boolean;
};

function DeliveryChartSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("grid gap-3 lg:grid-cols-12", className)}>
      <div className="grid min-w-0 grid-cols-3 gap-2 lg:col-span-4 lg:grid-cols-1 lg:gap-2">
        <Skeleton className="h-[5.5rem] rounded-lg lg:h-28" />
        <Skeleton className="h-[5.5rem] rounded-lg lg:h-28" />
        <Skeleton className="h-[5.5rem] rounded-lg lg:h-28" />
      </div>
      <Skeleton className="h-52 rounded-xl lg:col-span-8" />
    </div>
  );
}

function WorkflowChartSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("grid gap-3 lg:grid-cols-12", className)}>
      <Skeleton className="h-40 rounded-xl lg:col-span-4" />
      <Skeleton className="h-40 rounded-xl lg:col-span-8" />
    </div>
  );
}

function HoursChartSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-12">
        <Skeleton className="h-24 rounded-xl lg:col-span-4" />
        <Skeleton className="h-24 rounded-xl lg:col-span-4" />
        <Skeleton className="h-24 rounded-xl col-span-2 lg:col-span-4" />
      </div>
      <Skeleton className="h-32 w-full rounded-xl" />
      <div className="grid gap-3 lg:grid-cols-2">
        <Skeleton className="h-44 rounded-xl" />
        <Skeleton className="h-44 rounded-xl" />
      </div>
    </div>
  );
}

function CardBlockSkeleton({ className }: { className?: string }) {
  return <Skeleton className={cn("h-36 w-full rounded-xl", className)} />;
}

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
