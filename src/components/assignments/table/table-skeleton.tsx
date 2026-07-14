import { Skeleton } from "@/components/ui/skeleton";

const COLUMN_COUNT = 7;
const PLACEHOLDER_ROW_COUNT = 15;

export function TableSkeleton() {
  return (
    <div className="rounded-lg border">
      <div className="bg-muted/40 flex border-b px-3 py-2">
        <div className="grid w-full grid-cols-7 gap-3 text-xs">
          {Array.from({ length: COLUMN_COUNT }).map((_, idx) => (
            <Skeleton key={`hdr-${idx}`} className="h-3 w-24" />
          ))}
        </div>
      </div>
      <div className="divide-y">
        {Array.from({ length: PLACEHOLDER_ROW_COUNT }).map((_, idx) => (
          <div
            key={`row-${idx}`}
            className="grid grid-cols-7 items-center gap-3 px-3 py-3"
          >
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="ml-auto h-4 w-10" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="ml-auto h-4 w-8" />
          </div>
        ))}
      </div>
    </div>
  );
}
