import type { SolicitudDto } from "@/lib/novedades/list-my-solicitudes";
import {
  formatSolicitudDays,
  formatSolicitudFieldDateTime,
  formatSolicitudHours,
} from "@/lib/solicitudes/solicitud-field-format";

export type SolicitudFieldAlign = "left" | "right";

export type SolicitudFieldKey =
  | "tipo"
  | "assignedTo"
  | "fechaInicio"
  | "fechaFin"
  | "fechaReintegro"
  | "hours"
  | "days";

/**
 * Listado maestro de campos que muestran ambas vistas (móvil/escritorio) de la
 * tabla. Cada entry indica cómo extraer el valor ya formateado; las vistas
 * sólo eligen el layout (lista o celdas). Mantener una sola fuente de verdad
 * aquí evita que las dos vistas se desincronicen al añadir un campo nuevo.
 */
export type SolicitudField = Readonly<{
  key: SolicitudFieldKey;
  label: string;
  getValue: (solicitud: SolicitudDto) => string;
  align: SolicitudFieldAlign;
}>;

export const SOLICITUD_FIELDS: readonly SolicitudField[] = [
  { key: "tipo", label: "Tipo", align: "left", getValue: (s) => s.tipo ?? "—" },
  { key: "assignedTo", label: "Asignado", align: "left", getValue: (s) => s.assignedTo ?? "—" },
  {
    key: "fechaInicio",
    label: "Inicio",
    align: "left",
    getValue: (s) => formatSolicitudFieldDateTime(s.fechaInicio, s.fechaInicioHora),
  },
  {
    key: "fechaFin",
    label: "Fin",
    align: "left",
    getValue: (s) => formatSolicitudFieldDateTime(s.fechaFin, s.fechaFinHora),
  },
  {
    key: "fechaReintegro",
    label: "Reintegro",
    align: "left",
    getValue: (s) => formatSolicitudFieldDateTime(s.fechaReintegro, s.fechaReintegroHora),
  },
  { key: "hours", label: "Horas", align: "right", getValue: (s) => formatSolicitudHours(s.hours) },
  { key: "days", label: "Días", align: "right", getValue: (s) => formatSolicitudDays(s.hours) },
];

/** Decide el ancho mínimo/máximo y el alineamiento de la celda desktop para
 *  un campo, manteniendo la regla de que campos largos se truncan. */
export function resolveFieldCellLayout(field: SolicitudField): {
  widthClass: string;
  align: "left" | "right";
  /** Cuando `true`, el renderer añade tooltip porque el texto suele truncarse. */
  withTooltip: boolean;
} {
  if (field.key === "tipo") {
    return { widthClass: "max-w-[160px] min-w-[120px]", align: "left", withTooltip: true };
  }
  if (field.key === "assignedTo") {
    return { widthClass: "max-w-[220px] min-w-[180px]", align: "left", withTooltip: false };
  }
  return {
    widthClass: "",
    align: field.align,
    withTooltip: false,
  };
}

/** Etiqueta visible del estado del work item, con fallback para ausencias. */
export function resolveSolicitudStateLabel(state: string | null | undefined): string {
  return state && state.length > 0 ? state : "—";
}
