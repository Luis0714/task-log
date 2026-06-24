import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export type NeosIaFooterSkeletonProps = {
  className?: string;
};

/**
 * Skeleton for the footer input of `/neos-ia`. Mirrors the layout of
 * {@link import("@/components/copilot/copilot-input").CopilotInput}: a
 * textarea on top and a row below with a microphone button and the
 * "Interpretar" submit button.
 */
export function NeosIaFooterSkeleton({ className }: Readonly<NeosIaFooterSkeletonProps>) {
  return (
    <footer
      role="contentinfo"
      aria-hidden
      className={cn(
        "bg-background shrink-0 border-t px-2 py-3 sm:px-0",
        className,
      )}
    >
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-3 xl:max-w-4xl">
        <Skeleton className="h-24 w-full rounded-md" />
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <Skeleton className="size-10 rounded-md" />
            <Skeleton className="h-10 flex-1 rounded-md sm:flex-none sm:w-32" />
          </div>
          <Skeleton className="hidden h-3 w-16 sm:block" />
        </div>
      </div>
    </footer>
  );
}