import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function TimeLogFormSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("flex w-full min-w-0 flex-col gap-5", className)}>
      <div className="space-y-4 rounded-xl border border-border/60 p-4">
        <Skeleton className="h-5 w-32" />
        <div className="flex flex-col gap-2 sm:flex-row">
          <Skeleton className="h-16 w-full rounded-lg sm:flex-1" />
          <Skeleton className="h-16 w-full rounded-lg sm:flex-1" />
        </div>
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full sm:w-48" />
      </div>
    </div>
  );
}
