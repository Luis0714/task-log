import { PageHeaderSkeleton } from "@/components/skeletons/page-header-skeleton";
import { cn } from "@/lib/utils";

export function TimeLogShellSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("flex w-full flex-col gap-5", className)}>
      <PageHeaderSkeleton />
    </div>
  );
}
