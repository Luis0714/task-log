import { Skeleton } from "@/components/ui/skeleton";

export function PullRequestDetailSkeleton() {
  return (
    <div className="flex min-w-0 flex-col gap-4" aria-hidden>
      <div className="flex justify-between gap-2">
        <Skeleton className="h-8 w-36" />
        <Skeleton className="h-8 w-28" />
      </div>
      <Skeleton className="h-8 w-3/4" />
      <Skeleton className="h-4 w-64" />
      <div className="flex gap-2">
        <Skeleton className="h-7 w-20" />
        <Skeleton className="h-7 w-20" />
        <Skeleton className="h-7 w-28" />
      </div>
      <div className="flex flex-col gap-3 md:flex-row">
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-40 w-full rounded-xl" />
        </div>
        <Skeleton className="h-56 w-full rounded-xl md:w-72" />
      </div>
    </div>
  );
}
