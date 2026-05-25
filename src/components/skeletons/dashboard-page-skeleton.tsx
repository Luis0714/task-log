import { PageHeaderSkeleton } from "@/components/skeletons/page-header-skeleton";
import { SectionBlockSkeleton } from "@/components/skeletons/section-block-skeleton";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function DashboardPageSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("flex w-full flex-col gap-6 pb-6", className)}>
      <PageHeaderSkeleton />
      <Skeleton className="h-11 w-full max-w-3xl rounded-lg" />
      <SectionBlockSkeleton content="chart" />
      <SectionBlockSkeleton content="chart" />
      <SectionBlockSkeleton content="list-compact" />
      <SectionBlockSkeleton content="card" />
    </div>
  );
}
