import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export type NeosIaWelcomeSkeletonProps = {
  className?: string;
};

/**
 * Skeleton for the empty-state welcome screen of `/neos-ia`. Mirrors the
 * layout of {@link import("@/components/neos-ia/neos-ia-welcome").NeosIaWelcome}:
 * a centered column with a rounded badge, a large title, a multi-line
 * paragraph and a row of suggestion chips.
 */
export function NeosIaWelcomeSkeleton({ className }: Readonly<NeosIaWelcomeSkeletonProps>) {
  return (
    <section
      aria-hidden
      className={cn(
        "grid min-h-full place-items-center px-4 py-8 sm:py-12",
        className,
      )}
    >
      <div className="flex max-w-2xl flex-col items-center gap-6 text-center">
        <Skeleton className="size-10 rounded-full" />
        <Skeleton className="h-10 w-72 max-w-full sm:h-12 sm:w-96" />
        <div className="flex w-full max-w-xl flex-col items-center gap-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-11/12" />
          <Skeleton className="h-4 w-10/12" />
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Skeleton className="h-7 w-40 rounded-full" />
          <Skeleton className="h-7 w-44 rounded-full" />
          <Skeleton className="h-7 w-48 rounded-full" />
        </div>
      </div>
    </section>
  );
}