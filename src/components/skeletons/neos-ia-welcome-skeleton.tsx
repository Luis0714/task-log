import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export type NeosIaWelcomeSkeletonProps = {
  className?: string;
};

/**
 * Skeleton para el empty-state de `/neos-ia`. Refleja el layout de
 * `NeosIaWelcome`: título centrado, párrafo corto y fila de chips
 * redondeados. Sin icon-badge (la versión actual no lo usa).
 */
export function NeosIaWelcomeSkeleton({ className }: Readonly<NeosIaWelcomeSkeletonProps>) {
  return (
    <section
      aria-hidden
      className={cn(
        "flex min-h-full flex-col items-center justify-center px-2 py-12 text-center sm:py-20",
        className,
      )}
    >
      <Skeleton className="h-7 w-56 sm:h-9 sm:w-72" />
      <div className="mt-3 flex w-full max-w-md flex-col items-center gap-2">
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3.5 w-5/6" />
      </div>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
        <Skeleton className="h-7 w-36 rounded-full" />
        <Skeleton className="h-7 w-40 rounded-full" />
        <Skeleton className="h-7 w-32 rounded-full" />
        <Skeleton className="h-7 w-44 rounded-full" />
      </div>
    </section>
  );
}