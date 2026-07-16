"use client";

import { Skeleton } from "@/components/ui/skeleton";

/** Placeholder desktop mientras se cargan las solicitudes. */
export function SolicitudSkeletonRow() {
  return (
    <div className="flex items-center gap-3 px-3 py-3">
      <Skeleton className="h-4 flex-1" />
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-4 w-24" />
    </div>
  );
}
