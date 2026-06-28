import { Skeleton } from "@/components/ui/skeleton";
import { NeosIaFooterSkeleton } from "@/components/skeletons/neos-ia-footer-skeleton";
import { NeosIaWelcomeSkeleton } from "@/components/skeletons/neos-ia-welcome-skeleton";
import { cn } from "@/lib/utils";

export type NeosIaPageSkeletonProps = {
  className?: string;
};

/**
 * Page-level skeleton for `/neos-ia`. Refleja el layout minimalista de
 * {@link import("@/components/neos-ia/neos-ia-view").NeosIaView}:
 *
 * - Header 64px (sin border) con `Neos IA` + chips de provider/Nueva conversación.
 * - Zona central scrolleable con el welcome empty state.
 * - Footer sticky con el composer.
 */
export function NeosIaPageSkeleton({ className }: Readonly<NeosIaPageSkeletonProps>) {
  return (
    <div className={cn("flex h-full min-h-0 w-full flex-col", className)}>
      <div className="bg-background/95 sticky top-0 z-20 flex h-16 shrink-0 items-center px-4 backdrop-blur-md supports-backdrop-filter:bg-background/80">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold tracking-tight text-muted-foreground">
              Neos IA
            </span>
            <Skeleton className="h-7 w-36 rounded-md" />
          </div>
          <Skeleton className="h-9 w-28 rounded-md" />
        </div>
      </div>

      <div className="thin-scrollbar min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex h-full w-full max-w-3xl items-center justify-center px-4 py-6 xl:max-w-4xl">
          <NeosIaWelcomeSkeleton className="w-full" />
        </div>
      </div>

      <NeosIaFooterSkeleton />
    </div>
  );
}
