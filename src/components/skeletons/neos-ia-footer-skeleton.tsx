import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export type NeosIaFooterSkeletonProps = {
  className?: string;
};

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
      <div className="mx-auto w-full max-w-3xl px-4">
        <Skeleton className="h-[68px] w-full rounded-[28px]" />
      </div>
    </footer>
  );
}
