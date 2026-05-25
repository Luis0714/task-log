import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export type PbiListSkeletonProps = {
  variant?: "featured" | "compact";
  className?: string;
};

export function PbiListSkeleton({ variant = "compact", className }: PbiListSkeletonProps) {
  if (variant === "featured") {
    return (
      <div className={cn("@container grid grid-cols-1 gap-3 @md:grid-cols-2", className)}>
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div
      className={cn("space-y-2 rounded-xl border border-border/60 p-2", className)}
    >
      <Skeleton className="h-14 w-full" />
      <Skeleton className="h-14 w-full" />
      <Skeleton className="h-14 w-5/6" />
    </div>
  );
}
