import { PbiListSkeleton } from "@/components/skeletons/pbi-list-skeleton";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export type SectionBlockSkeletonProps = {
  content?: "list-compact" | "list-featured" | "chart" | "card";
  className?: string;
};

function ChartBlockSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("grid gap-3 lg:grid-cols-12", className)}>
      <Skeleton className="h-28 rounded-xl lg:col-span-4" />
      <Skeleton className="h-28 rounded-xl lg:col-span-4" />
      <Skeleton className="h-28 rounded-xl lg:col-span-4" />
      <Skeleton className="h-48 rounded-xl lg:col-span-12" />
    </div>
  );
}

function CardBlockSkeleton({ className }: { className?: string }) {
  return <Skeleton className={cn("h-36 w-full rounded-xl", className)} />;
}

export function SectionBlockSkeleton({
  content = "list-compact",
  className,
}: SectionBlockSkeletonProps) {
  return (
    <section className={cn("flex flex-col gap-2", className)}>
      <div className="space-y-1.5">
        <Skeleton className="h-6 w-40 max-w-full sm:w-48" />
        <Skeleton className="h-4 w-full max-w-lg" />
      </div>
      {content === "list-featured" ? <PbiListSkeleton variant="featured" /> : null}
      {content === "list-compact" ? <PbiListSkeleton variant="compact" /> : null}
      {content === "chart" ? <ChartBlockSkeleton /> : null}
      {content === "card" ? <CardBlockSkeleton /> : null}
    </section>
  );
}
