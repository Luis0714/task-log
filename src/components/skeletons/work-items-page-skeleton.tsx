import { PageHeaderSkeleton } from "@/components/skeletons/page-header-skeleton";
import { SectionBlockSkeleton } from "@/components/skeletons/section-block-skeleton";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export type WorkItemsPageSkeletonProps = {
  className?: string;
};

export function WorkItemsPageSkeleton({ className }: WorkItemsPageSkeletonProps) {
  return (
    <div className={cn("flex w-full flex-col gap-8 pb-6", className)}>
      <PageHeaderSkeleton />
      <Skeleton className="h-11 w-full max-w-2xl rounded-lg" />
      <SectionBlockSkeleton content="list-compact" />
      <SectionBlockSkeleton content="list-featured" />
      <SectionBlockSkeleton content="list-compact" />
      <SectionBlockSkeleton content="list-compact" />
    </div>
  );
}
