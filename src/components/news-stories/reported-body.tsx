"use client";

import {
  ReportedEmptyState,
  ReportedList,
  ReportedSkeleton,
} from "@/components/news-stories/reported-list";
import type { ReportedNewsDetail } from "@/lib/azure-devops/list-reported-news";
import type { DateFilterMode } from "@/components/news-stories/news-stories-reported-format";

export type ReportedBodyProps = Readonly<{
  items: ReadonlyArray<ReportedNewsDetail>;
  loading: boolean;
  error: string | null;
  projectReady: boolean;
  mode: DateFilterMode;
}>;

/**
 * Cuerpo de la sección. Decide qué renderizar según el estado de carga:
 *   1. Sin proyecto        → empty-state pidiendo selección.
 *   2. Cargando            → skeleton.
 *   3. Error               → banner con mensaje del backend.
 *   4. Sin resultados      → empty-state contextual al modo.
 *   5. Datos               → lista con `<ReportedList>`.
 *
 * El fetch + estado vive en `useReportedNewsStories` (lo usa el padre);
 * este componente sólo decide qué pintar en función del estado que recibe.
 */
export function ReportedBody({
  items,
  loading,
  error,
  projectReady,
  mode,
}: ReportedBodyProps) {
  if (!projectReady) {
    return (
      <ReportedEmptyState
        title="Selecciona un proyecto"
        description="Las novedades reportadas se cargan cuando eliges un (proyecto, equipo) arriba."
      />
    );
  }
  if (loading) {
    return <ReportedSkeleton />;
  }
  if (error) {
    return (
      <div className="text-muted-foreground flex items-center justify-between gap-2 rounded-lg border border-dashed py-2 pl-3 pr-2 text-xs">
        <span>No se pudo consultar el reporte de novedades: {error}</span>
      </div>
    );
  }
  if (items.length === 0) {
    return (
      <ReportedEmptyState
        title={
          mode === "all" ? "Sin novedades reportadas" : "Sin novedades en este periodo"
        }
        description={
          mode === "all"
            ? "No hay novedades reportadas para las HUs vinculadas."
            : "No se encontraron novedades reportadas para las HUs vinculadas en el periodo seleccionado."
        }
      />
    );
  }
  return <ReportedList items={items} />;
}
