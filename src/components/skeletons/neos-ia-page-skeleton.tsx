import { NeosIaFooterSkeleton } from "@/components/skeletons/neos-ia-footer-skeleton";
import { NeosIaWelcomeSkeleton } from "@/components/skeletons/neos-ia-welcome-skeleton";
import { PageHeaderSkeleton } from "@/components/skeletons/page-header-skeleton";
import { cn } from "@/lib/utils";

export type NeosIaPageSkeletonProps = {
  className?: string;
};

/**
 * Page-level skeleton for `/neos-ia`. Mirrors the layout of
 * {@link import("@/components/neos-ia/neos-ia-view").NeosIaView}: a fixed
 * header, a scrollable central area showing the welcome empty state, and a
 * footer pinned to the bottom with the message input.
 */
export function NeosIaPageSkeleton({ className }: Readonly<NeosIaPageSkeletonProps>) {
  return (
    <div className={cn("flex h-full min-h-0 w-full flex-col", className)}>
      <div className="flex shrink-0 items-start justify-between gap-4 pb-3">
        <PageHeaderSkeleton />
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex-1 overflow-hidden">
          <NeosIaWelcomeSkeleton className="mx-auto h-full w-full max-w-3xl xl:max-w-4xl" />
        </div>

        <NeosIaFooterSkeleton />
      </div>
    </div>
  );
}