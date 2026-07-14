import { Skeleton } from "@/components/ui/skeleton";

export default function SolicitudesLoading() {
  return (
    <div className="flex min-h-0 w-full flex-1 flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-80" />
        </div>
        <Skeleton className="h-8 w-36" />
      </div>
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  );
}
