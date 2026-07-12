import { User } from "lucide-react";

import { WorkItemId } from "@/components/work-items/work-item-id";
import { WorkItemStateBadge } from "@/components/work-items/work-item-state-badge";
import type { ReportedNewsDetail } from "@/lib/azure-devops/list-reported-news";
import {
  formatDateRange,
  formatShortDate,
  stripHtml,
} from "@/components/news-stories/news-stories-reported-format";

export type ReportedRowMetaProps = Readonly<{
  item: ReportedNewsDetail;
}>;

/**
 * Línea meta del row: rango de fechas, fecha de reintegro, asignado a y HU
 * padre — sólo aparecen si el campo está presente en el item.
 */
export function ReportedRowMeta({ item }: ReportedRowMetaProps) {
  const fechaInicio = formatShortDate(item.fechaInicio);
  const fechaFin = formatShortDate(item.fechaFin);
  const fechaReintegro = formatShortDate(item.fechaReintegro);

  return (
    <div className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs">
      {formatDateRange(fechaInicio, fechaFin)}
      {fechaReintegro ? (
        <span className="inline-flex items-center gap-1">
          Reintegro:{" "}
          <span className="text-foreground/70">{fechaReintegro}</span>
        </span>
      ) : null}
      {item.assignedTo ? (
        <span className="inline-flex items-center gap-1">
          <User className="size-3" aria-hidden />
          <span className="text-foreground/70">{item.assignedTo}</span>
        </span>
      ) : null}
      {item.parentId ? (
        <span className="text-muted-foreground/80 inline-flex items-center gap-1">
          HU padre #{item.parentId}
        </span>
      ) : null}
    </div>
  );
}

/**
 * Cabecera del row: id + state badge + tipo badge. La descripción se renderiza
 * aparte para que el caller controle dónde.
 */
export function ReportedRowHeader({ item }: ReportedRowMetaProps) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <WorkItemId id={item.id} />
      {item.state ? (
        <WorkItemStateBadge state={item.state} className="max-w-26" />
      ) : null}
      {item.tipoNovedad ? (
        <span className="bg-muted text-foreground/70 rounded-full border px-2 py-0.5 text-[11px] font-medium">
          {item.tipoNovedad}
        </span>
      ) : null}
    </div>
  );
}

/** Helper: descripción de la novedad con HTML → texto plano y truncada a
 *  dos líneas. Devuelve `null` si no hay descripción. */
export function ReportedRowDescription({ item }: ReportedRowMetaProps) {
  if (!item.description) return null;
  const text = stripHtml(item.description);
  return (
    <p
      className="text-muted-foreground line-clamp-2 max-w-2xl text-xs"
      title={text}
    >
      {text}
    </p>
  );
}
