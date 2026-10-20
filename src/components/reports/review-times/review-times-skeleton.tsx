import { PageHeaderSkeleton } from "@/components/skeletons/page-header-skeleton";

export function ReviewTimesSkeleton() {
  return (
    <div className="flex w-full flex-col gap-5">
      <PageHeaderSkeleton />
      <div className="bg-muted h-28 animate-pulse rounded-md" />
      <div className="grid gap-3 md:grid-cols-2">
        <div className="bg-muted h-24 animate-pulse rounded-md" />
        <div className="bg-muted h-24 animate-pulse rounded-md" />
      </div>
    </div>
  );
}
