import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export type DeliveryChartSkeletonProps = {
  className?: string;
};

export function DeliveryChartSkeleton({ className }: DeliveryChartSkeletonProps) {
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
