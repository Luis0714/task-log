import { Skeleton } from "@/components/ui/skeleton";

export type PullRequestListSkeletonProps = {
  rows?: number;
};

export function PullRequestListSkeleton({ rows = 5 }: PullRequestListSkeletonProps) {
  return (
    <ul className="flex flex-col gap-2" aria-hidden>
      {Array.from({ length: rows }, (_, index) => (
        <li key={index} className="rounded-xl border bg-card p-3">
          <div className="flex items-center justify-between gap-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-5 w-28 rounded-full" />
          </div>
          <Skeleton className="mt-3 h-3 w-40" />
          <div className="mt-3 flex gap-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-8" />
            <Skeleton className="h-4 w-8" />
          </div>
        </li>
      ))}
    </ul>
  );
}
