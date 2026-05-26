import { PageHeaderSkeleton } from "@/components/skeletons/page-header-skeleton";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function WorkItemsShellSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("flex w-full flex-col gap-8", className)}>
      <PageHeaderSkeleton />
      <Skeleton className="h-11 w-full max-w-2xl rounded-lg" />
    </div>
  );
}
