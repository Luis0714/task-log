import { PageHeaderSkeleton } from "@/components/skeletons/page-header-skeleton";
import { SectionBlockSkeleton } from "@/components/skeletons/section-block-skeleton";
import { cn } from "@/lib/utils";

export type ShellContentSkeletonProps = {
  className?: string;
};

export function ShellContentSkeleton({ className }: ShellContentSkeletonProps) {
  return (
    <div className={cn("flex w-full flex-col gap-6 pb-6", className)}>
      <PageHeaderSkeleton />
      <SectionBlockSkeleton content="chart" />
      <SectionBlockSkeleton content="list-compact" />
      <SectionBlockSkeleton content="list-compact" />
    </div>
  );
}
