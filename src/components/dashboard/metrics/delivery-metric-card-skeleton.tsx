import { Skeleton } from "@/components/ui/skeleton";

export function DeliveryMetricCardSkeleton() {
  return (
    <div className="flex min-h-full min-w-0 flex-col gap-2 p-2.5">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-1.5">
          <Skeleton className="size-3.5 shrink-0 rounded-sm" />
          <Skeleton className="h-3 min-w-0 flex-1" />
        </div>
        <Skeleton className="h-7 w-16" />
      </div>
      <div className="mt-auto flex flex-col gap-1 pt-0.5">
        <Skeleton className="h-1.5 w-full rounded-full" />
        <Skeleton className="h-2.5 w-10" />
      </div>
    </div>
  );
}
