import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export type NeosIaWelcomeSkeletonProps = {
  className?: string;
};

/**
 * Skeleton para el empty-state de `/neos-ia`. Refleja el layout de
 * {@link import("@/components/neos-ia/neos-ia-welcome").NeosIaWelcome}:
 * un único `<h1>` "¿En qué trabajaste hoy?" con tamaño
 * `text-2xl font-semibold sm:text-3xl`. Las quick action pills viven
 * en el layout padre, no aquí.
 */
export function NeosIaWelcomeSkeleton({
  className,
}: Readonly<NeosIaWelcomeSkeletonProps>) {
  return (
    <Skeleton
      aria-hidden
      className={cn("h-7 w-56 sm:h-9 sm:w-72", className)}
    />
  );
}