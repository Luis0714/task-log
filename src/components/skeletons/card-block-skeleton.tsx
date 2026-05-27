import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export type CardBlockSkeletonProps = {
  className?: string;
};

export function CardBlockSkeleton({ className }: CardBlockSkeletonProps) {
  return <Skeleton className={cn("h-36 w-full rounded-xl", className)} />;
}
