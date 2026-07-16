import type { SolicitudDto } from "@/lib/novedades/list-my-solicitudes";

export type SolicitudesTableView =
  | { kind: "loading" }
  | { kind: "empty" }
  | { kind: "populated"; solicitudes: readonly SolicitudDto[] };

/**
 * Decide el modo de render del listado "Mis solicitudes":
 * - `loading` mientras hay un fetch en curso (incluye filtros en cambio).
 * - `empty` cuando ya terminó el fetch y no hay datos.
 * - `populated` cuando hay datos para enseñar.
 *
 * Centralizar esta decisión en un hook evita que el componente padre
 * mantenga dos `useState` paralelos (`loadingList` + `solicitudes`) con
 * lógica de prioridad.
 */
export function useSolicitudesTableView(
  solicitudes: readonly SolicitudDto[],
  loading: boolean,
): SolicitudesTableView {
  if (loading) return { kind: "loading" };
  if (solicitudes.length === 0) return { kind: "empty" };
  return { kind: "populated", solicitudes };
}
