"use client";

import { SolicitudSkeletonCard } from "@/components/solicitudes/solicitud-skeleton-card";
import { SolicitudSkeletonRow } from "@/components/solicitudes/solicitud-skeleton-row";

const SKELETON_ROW_KEYS = ["row-1", "row-2", "row-3", "row-4"] as const;

/** Skeleton combinado (móvil + desktop) del listado "Mis solicitudes". */
export function SolicitudesTableSkeleton() {
  const skeletonRows = SKELETON_ROW_KEYS.map((key) => (
    <SolicitudSkeletonRow key={key} />
  ));
  const skeletonCards = SKELETON_ROW_KEYS.map((key) => (
    <SolicitudSkeletonCard key={key} />
  ));
  return (
    <div className="overflow-hidden rounded-xl border">
      <ul className="space-y-3 p-3 md:hidden">{skeletonCards}</ul>
      <div className="hidden md:block">
        <div className="divide-y">{skeletonRows}</div>
      </div>
    </div>
  );
}
