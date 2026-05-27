import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export type HoursChartSkeletonProps = {
  className?: string;
};

export function HoursChartSkeleton({ className }: HoursChartSkeletonProps) {
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
