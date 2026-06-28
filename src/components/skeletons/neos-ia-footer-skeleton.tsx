import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export type NeosIaFooterSkeletonProps = {
  className?: string;
};

/**
 * Skeleton del composer flotante de Neos IA. Refleja el layout de
 * {@link import("@/components/copilot/copilot-input").CopilotInput}:
 * un único bloque redondeado (textarea + mic + send) sin popover
 * secundario. Aparece sobre `bg-background` con margen inferior generoso.
 */
export function NeosIaFooterSkeleton({ className }: Readonly<NeosIaFooterSkeletonProps>) {
  return (
    <footer
      role="contentinfo"
      aria-hidden
      className={cn(
        "bg-background/95 sticky bottom-0 z-20 shrink-0 pb-4 pt-3 backdrop-blur-md supports-backdrop-filter:bg-background/80 sm:pb-6 sm:pt-4",
        className,
      )}
    >
      <div className="mx-auto flex w-full max-w-3xl items-end gap-2 px-4">
        <Skeleton className="bg-background border-border/60 h-12 w-full rounded-2xl border" />
        <Skeleton className="size-9 rounded-md" />
        <Skeleton className="size-9 rounded-md" />
      </div>
    </footer>
  );
}
