import { Skeleton } from "@/components/ui/skeleton";
import { PROGRESS_RING_CHART_SIZE_CLASS } from "@/lib/dashboard/chart-config";
import { cn } from "@/lib/utils";

export function ProgressRingSkeleton({ rowCount = 3 }: { rowCount?: number }) {
  return (
    <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
      <Skeleton className={cn("mx-auto rounded-full sm:mx-0", PROGRESS_RING_CHART_SIZE_CLASS)} />
      <div className="flex-1 space-y-1.5">
        {Array.from({ length: rowCount }).map((_, index) => (
          <Skeleton
            key={index}
            className={index === 0 ? "h-4 w-full" : index === 1 ? "h-4 w-4/5" : "h-4 w-3/5"}
          />
        ))}
      </div>
    </div>
  );
}
