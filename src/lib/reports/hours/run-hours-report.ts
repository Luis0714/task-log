import "server-only";

import type { AdoCallerAuth } from "@/lib/azure-devops/resolve-auth";
import type { ReportedNewsScope } from "@/lib/azure-devops/list-reported-news";
import { loadTeamMembers } from "@/lib/filters/load-team-members";
import { getRepositories } from "@/lib/db";
import {
  buildHoursReport,
  type BuildHoursReportFilters,
  type BuildHoursReportPeriod,
} from "@/lib/reports/hours/build-hours-report";
import type { HoursReportResult } from "@/lib/reports/hours/hours-report-types";

/**
 * Un scope por cada par (proyecto, equipo) seleccionado. Cada equipo genera su
 * propio scope para incluir a sus miembros (no solo el primero). Sin proyecto →
 * scope comodín; sin equipo → `teamId` nulo (no se puede cargar roster).
 */
export function resolveHoursReportScopes(
  projectIds: string[],
  teamIds: string[],
): ReportedNewsScope[] {
  const projects = projectIds.length > 0 ? projectIds : ["*"];
  const teams: (string | null)[] = teamIds.length > 0 ? teamIds : [null];
  const result: ReportedNewsScope[] = [];
  for (const projectId of projects) {
    for (const teamId of teams) {
      result.push({ projectId, teamId });
    }
  }
  return result;
}

export type RunHoursReportInput = {
  auth: AdoCallerAuth;
  period: BuildHoursReportPeriod;
  projectIds: string[];
  teamIds: string[];
  filters?: BuildHoursReportFilters;
};

/**
 * Punto ÚNICO para construir el reporte de horas. Lo comparten la vista
 * (`/generate`) y la exportación (`/excel`) para que el Excel refleje
 * exactamente la misma tabla: mismo producto de scopes, mismo roster de equipo
 * y mismas reglas de cálculo.
 */
export function runHoursReport(input: RunHoursReportInput): Promise<HoursReportResult> {
  const scopes = resolveHoursReportScopes(input.projectIds, input.teamIds);
  return buildHoursReport(
    { scopes, period: input.period, filters: input.filters },
    {
      auth: input.auth,
      assignmentRepo: getRepositories().personProjectAssignment,
      newsStoriesRepo: getRepositories().newsStories,
      loadTeamMembers: async (scope) => {
        if (!scope.teamId || scope.projectId === "*") return [];
        const members = await loadTeamMembers({
          project: scope.projectId,
          team: scope.teamId,
        });
        return members.map((m) => ({
          personAdoId: m.id,
          personDisplayName: m.displayName,
        }));
      },
    },
  );
}
