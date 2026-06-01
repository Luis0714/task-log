import { Skeleton } from "@/components/ui/skeleton";

export function ProgressRingSkeleton({ rowCount = 3 }: { rowCount?: number }) {
  return (
    <div className="flex items-center gap-3 sm:gap-4">
      <Skeleton className="size-[72px] shrink-0 rounded-full sm:size-[88px] md:size-[100px]" />
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
