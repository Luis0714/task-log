import { Skeleton } from "@/components/ui/skeleton";

export type ReleaseListSkeletonProps = {
  rows?: number;
};

export function ReleaseListSkeleton({ rows = 5 }: ReleaseListSkeletonProps) {
  return (
    <ul className="flex flex-col gap-2" aria-hidden>
      {Array.from({ length: rows }, (_, index) => (
        <li key={index} className="rounded-xl border bg-card p-3">
          <div className="flex items-start gap-3">
            <Skeleton className="size-10 shrink-0 rounded-full" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-5 w-28 rounded-full" />
              </div>
              <Skeleton className="mt-2 h-3 w-24" />
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <Skeleton className="h-6 w-12 rounded-full" />
            <Skeleton className="h-6 w-12 rounded-full" />
            <Skeleton className="h-6 w-14 rounded-full" />
            <Skeleton className="h-6 w-14 rounded-full" />
          </div>
        </li>
      ))}
    </ul>
  );
}
