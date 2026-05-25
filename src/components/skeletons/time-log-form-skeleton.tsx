import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function TimeLogFormSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col gap-5", className)}>
      <div className="rounded-xl border border-border/60 p-4 space-y-4">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-10 w-full max-w-md" />
        <Skeleton className="h-10 w-full max-w-md" />
        <Skeleton className="h-10 w-full max-w-md" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-36" />
      </div>
    </div>
  );
}
