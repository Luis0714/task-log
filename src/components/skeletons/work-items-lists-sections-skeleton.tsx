import { SectionBlockSkeleton } from "@/components/skeletons/section-block-skeleton";
import { cn } from "@/lib/utils";

export type WorkItemsListsSectionsSkeletonProps = {
  className?: string;
};

export function WorkItemsListsSectionsSkeleton({
  className,
}: WorkItemsListsSectionsSkeletonProps) {
  return (
    <div className={cn("flex flex-col gap-8", className)}>
      <SectionBlockSkeleton content="list-compact" />
      <SectionBlockSkeleton content="list-featured" />
      <SectionBlockSkeleton content="list-compact" />
      <SectionBlockSkeleton content="list-compact" />
    </div>
  );
}
