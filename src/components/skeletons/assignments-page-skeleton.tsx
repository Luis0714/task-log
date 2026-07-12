import { PageHeaderSkeleton } from "@/components/skeletons/page-header-skeleton";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const BAR_CLASS_NAME =
  "flex flex-wrap items-end gap-3 border-b pb-4";

const HEADERS = [
  "Persona",
  "Proyecto",
  "Equipo",
  "%",
  "Inicio",
  "Fin",
  "",
] as const;

export type AssignmentsPageSkeletonProps = {
  className?: string;
};

export function AssignmentsPageSkeleton({
  className,
}: AssignmentsPageSkeletonProps) {
  return (
    <div
      className={cn(
        "flex min-h-0 w-full flex-1 flex-col gap-6",
        className,
      )}
    >
      <PageHeaderSkeleton />

      <div className={BAR_CLASS_NAME}>
        <div className="flex w-full max-w-xs flex-col gap-1.5">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-9 w-full" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-9 w-44" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-3 w-14" />
          <Skeleton className="h-9 w-44" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-3 w-8" />
          <Skeleton className="h-9 w-36 font-mono" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-3 w-8" />
          <Skeleton className="h-9 w-36 font-mono" />
        </div><div className="flex flex-col gap-1.5">
          <Skeleton className="h-3 w-8" />
          <Skeleton className="h-9 w-36 font-mono" />
        </div>
      </div>

      <div className="rounded-lg border">
        <div className="bg-muted/40 flex border-b px-3 py-2">
          <div className="grid w-full grid-cols-7 gap-3 text-xs">
            {HEADERS.map((label, idx) => (
              <Skeleton key={`${label}-${idx}`} className="h-3 w-24" />
            ))}
          </div>
        </div>
        <div className="divide-y">
          {Array.from({ length: 8 }).map((_, idx) => (
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
    </div>
  );
}
