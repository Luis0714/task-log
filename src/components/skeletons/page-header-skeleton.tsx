import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export type PageHeaderSkeletonProps = {
  className?: string;
};

export function PageHeaderSkeleton({ className }: PageHeaderSkeletonProps) {
  return (
    <header className={cn("space-y-2", className)}>
      <Skeleton className="h-8 w-48 max-w-full sm:h-9 sm:w-56" />
      <Skeleton className="h-4 w-full max-w-md" />
      <Skeleton className="h-4 w-4/5 max-w-sm" />
    </header>
  );
}
