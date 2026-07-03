import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export type WorkflowChartSkeletonProps = {
  className?: string;
};

export function WorkflowChartSkeleton({ className }: WorkflowChartSkeletonProps) {
  return (
    <div className={cn("grid gap-3 lg:grid-cols-12", className)}>
      <Skeleton className="h-40 rounded-xl lg:col-span-4" />
      <Skeleton className="h-40 rounded-xl lg:col-span-8" />
    </div>
  );
}
