import { Skeleton } from "@/components/ui/skeleton";

export function BranchCompareLoading() {
  return (
    <div className="flex flex-col gap-2" aria-busy="true" aria-label="Comparando ramas">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-24 w-full" />
    </div>
  );
}
