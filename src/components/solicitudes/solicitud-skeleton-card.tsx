"use client";

import { Skeleton } from "@/components/ui/skeleton";

/** Placeholder móvil mientras se cargan las solicitudes. */
export function SolicitudSkeletonCard() {
  return (
    <li className="space-y-2 rounded-xl border p-4">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
      <Skeleton className="h-3 w-1/3" />
    </li>
  );
}
