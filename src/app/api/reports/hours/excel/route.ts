import "server-only";

import { requireManagementUser } from "@/app/api/assignments/helpers";
import { ADO_SIGN_IN_REQUIRED_MESSAGE } from "@/lib/auth/ado-auth-messages";
import { requireAdoCaller } from "@/lib/ado/require-ado-caller";
import { buildHoursReport } from "@/lib/reports/hours/build-hours-report";
import { buildHoursReportExcel, buildHoursReportFilename } from "@/lib/reports/excel/hours-report-excel";
import { xlsxResponse } from "@/lib/reports/excel/route-helpers";
import { hoursReportExcelQuerySchema } from "@/lib/schemas/reports-hours";
import { getRepositories } from "@/lib/db";
import { apiErrorFromCause, apiErrorResponse } from "@/lib/errors/api-error-response";
import type { ReportedNewsScope } from "@/lib/azure-devops/list-reported-news";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = await requireManagementUser();
  if (!auth.ok) {
    return apiErrorResponse(auth.error, auth.status);
  }

  const url = new URL(req.url);
  const parsed = hoursReportExcelQuerySchema.safeParse({
    periodKind: url.searchParams.get("periodKind") ?? undefined,
    monthKey: url.searchParams.get("monthKey") ?? undefined,
    fromIso: url.searchParams.get("fromIso") ?? undefined,
    toIso: url.searchParams.get("toIso") ?? undefined,
    projectIds: url.searchParams.get("projects") ?? undefined,
    teamIds: url.searchParams.get("teams") ?? undefined,
    personAdoId: url.searchParams.get("person") ?? undefined,
    roleId: url.searchParams.get("role") ?? undefined,
  });

  if (!parsed.success) {
    return apiErrorResponse(parsed.error.issues[0]?.message ?? "Parámetros inválidos.", 400);
  }

  if (parsed.data.periodKind === "range") {
    if (!parsed.data.fromIso || !parsed.data.toIso) {
      return apiErrorResponse("Fechas desde/hasta requeridas.", 400);
    }
    if (parsed.data.fromIso > parsed.data.toIso) {
      return apiErrorResponse("La fecha hasta debe ser posterior a la fecha desde.", 400);
    }
  }

  const adoCaller = await requireAdoCaller();
  if (!adoCaller.ok) {
    return apiErrorResponse(ADO_SIGN_IN_REQUIRED_MESSAGE, 401);
  }

  const period =
    parsed.data.periodKind === "month"
      ? { kind: "month" as const, monthKey: parsed.data.monthKey ?? "" }
      : {
          kind: "range" as const,
          fromIso: parsed.data.fromIso ?? "",
          toIso: parsed.data.toIso ?? "",
        };

  const scopes = resolveScopes({
    projectIds: parsed.data.projectIds,
    teamIds: parsed.data.teamIds,
  });

  try {
    const result = await buildHoursReport(
      {
        scopes,
        period,
        filters: {
          personAdoId: parsed.data.personAdoId,
          roleId: parsed.data.roleId,
        },
      },
      {
        auth: adoCaller.auth,
        assignmentRepo: getRepositories().personProjectAssignment,
        newsStoriesRepo: getRepositories().newsStories,
      },
    );

    const projectNames = Array.from(new Set(result.rows.map((r) => r.projectName)));
    const periodLabel =
      period.kind === "month" ? period.monthKey : `${period.fromIso}_a_${period.toIso}`;

    const buffer = await buildHoursReportExcel({
      projectNames,
      periodLabel,
      result,
    });
    const filename = buildHoursReportFilename(projectNames, periodLabel);
    return xlsxResponse(buffer, filename);
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
      "reports/hours/excel GET",
      cause,
      "No se pudo generar el Excel del reporte de horas.",
    );
  }
}

function resolveScopes(scopes: { projectIds: string[]; teamIds: string[] }): ReportedNewsScope[] {
  if (scopes.projectIds.length === 0) {
    return [{ projectId: "*", teamId: null }];
  }
  return scopes.projectIds.map((projectId) => ({
    projectId,
    teamId: scopes.teamIds[0] ?? null,
  }));
}