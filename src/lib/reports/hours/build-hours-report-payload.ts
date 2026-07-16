import type { AdoCatalogSnapshot } from "@/lib/ado/types";
import { teamNamesForProjects } from "@/lib/filters/teams-by-project";
import type {
  HoursReportPeriodSchema,
  HoursReportRequestSchema,
} from "@/lib/schemas/reports-hours";

/**
 * Construye el `HoursReportRequestSchema` a enviar al backend a partir del
 * estado de filtros actual. Reglas:
 *
 * - Si `projectIds` está vacío, se usan todos los proyectos del catálogo.
 * - Si `teamIds` está vacío, se infieren los equipos de los proyectos
 *   seleccionados (o de todos si tampoco hay proyectos).
 *
 * Esta función es pura: no toca React ni servicios. La usa el hook
 * `useHoursReportFilters` (con overrides para los handlers que necesitan
 * pasar el valor NUEVO, no el del state, a `markStale`).
 */
export type BuildHoursReportPayloadInput = Readonly<{
  period: HoursReportPeriodSchema;
  projectIds: readonly string[];
  teamIds: readonly string[];
  allProjectNames: readonly string[];
  teamsByProject: AdoCatalogSnapshot["teamsByProject"];
}>;

export function buildHoursReportPayload(
  input: BuildHoursReportPayloadInput,
): HoursReportRequestSchema {
  const { period, projectIds, teamIds, allProjectNames, teamsByProject } = input;
  return {
    period,
    scopes: {
      projectIds: projectIds.length > 0 ? [...projectIds] : [...allProjectNames],
      teamIds:
        teamIds.length > 0
          ? [...teamIds]
          : teamNamesForProjects(teamsByProject, projectIds),
    },
  };
}