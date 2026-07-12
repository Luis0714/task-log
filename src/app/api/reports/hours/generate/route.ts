import "server-only";

import { NextResponse } from "next/server";

import { requireManagementUser } from "@/app/api/assignments/helpers";
import { ADO_SIGN_IN_REQUIRED_MESSAGE } from "@/lib/auth/ado-auth-messages";
import { requireAdoCaller } from "@/lib/ado/require-ado-caller";
import { buildHoursReport } from "@/lib/reports/hours/build-hours-report";
import { hoursReportRequestSchema } from "@/lib/schemas/reports-hours";
import { loadTeamMembers } from "@/lib/filters/load-team-members";
import { getRepositories } from "@/lib/db";
import { apiErrorFromCause, apiErrorResponse } from "@/lib/errors/api-error-response";
import type { ReportedNewsScope } from "@/lib/azure-devops/list-reported-news";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const auth = await requireManagementUser();
  if (!auth.ok) {
    return apiErrorResponse(auth.error, auth.status);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiErrorResponse("Body inválido.", 400);
  }

  const parsed = hoursReportRequestSchema.safeParse(body);
  if (!parsed.success) {
    return apiErrorResponse(parsed.error.issues[0]?.message ?? "Parámetros inválidos.", 400);
  }

  if (parsed.data.period.kind === "range" && parsed.data.period.fromIso > parsed.data.period.toIso) {
    return apiErrorResponse("La fecha hasta debe ser posterior a la fecha desde.", 400);
  }

  const adoCaller = await requireAdoCaller();
  if (!adoCaller.ok) {
    return apiErrorResponse(ADO_SIGN_IN_REQUIRED_MESSAGE, 401);
  }

  const scopes = resolveScopes(parsed.data.scopes);

  try {
    const result = await buildHoursReport(
      {
        scopes,
        period: parsed.data.period,
        filters: {
          personAdoId: parsed.data.personAdoId,
          roleId: parsed.data.roleId,
        },
      },
      {
        auth: adoCaller.auth,
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
    return NextResponse.json(result);
  } catch (cause) {
    if (
      cause instanceof Error &&
      /Nager|Date|holiday|festivo/i.test(cause.message)
    ) {
      return apiErrorResponse(
        "No se pudo generar el reporte: no pudimos cargar los festivos y días hábiles para las fechas seleccionadas.",
        500,
      );
    }
    return apiErrorFromCause(
      "reports/hours/generate POST",
      cause,
      "No se pudo generar el reporte de horas.",
    );
  }
}

/**
 * Un scope por cada par (proyecto, equipo) seleccionado. Cada equipo genera su
 * propio scope para que el reporte incluya a los miembros de cada equipo (no
 * solo el primero). Sin proyecto → scope comodín; sin equipo → `teamId` nulo
 * (no se puede cargar roster, pero no rompe la generación).
 */
function resolveScopes(scopes: { projectIds: string[]; teamIds: string[] }): ReportedNewsScope[] {
  const projectIds = scopes.projectIds.length > 0 ? scopes.projectIds : ["*"];
  const teamIds: (string | null)[] = scopes.teamIds.length > 0 ? scopes.teamIds : [null];
  const result: ReportedNewsScope[] = [];
  for (const projectId of projectIds) {
    for (const teamId of teamIds) {
      result.push({ projectId, teamId });
    }
  }
  return result;
}