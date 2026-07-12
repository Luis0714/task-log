import "server-only";

import { requireManagementUser } from "@/app/api/assignments/helpers";
import { ADO_SIGN_IN_REQUIRED_MESSAGE } from "@/lib/auth/ado-auth-messages";
import { requireAdoCaller } from "@/lib/ado/require-ado-caller";
import { filterHoursReportByVisibility } from "@/lib/reports/hours/filter-hours-report-by-visibility";
import { runHoursReport } from "@/lib/reports/hours/run-hours-report";
import {
  buildHoursReportExcel,
  buildHoursReportFilename,
  formatHoursReportPeriodLabel,
} from "@/lib/reports/excel/hours-report-excel";
import { xlsxResponse } from "@/lib/reports/excel/route-helpers";
import { hoursReportExcelRequestSchema } from "@/lib/schemas/reports-hours";
import { apiErrorFromCause, apiErrorResponse } from "@/lib/errors/api-error-response";

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

  const parsed = hoursReportExcelRequestSchema.safeParse(body);
  if (!parsed.success) {
    return apiErrorResponse(parsed.error.issues[0]?.message ?? "Parámetros inválidos.", 400);
  }

  const period = parsed.data.period;
  if (period.kind === "range" && period.fromIso > period.toIso) {
    return apiErrorResponse("La fecha hasta debe ser posterior a la fecha desde.", 400);
  }

  const adoCaller = await requireAdoCaller();
  if (!adoCaller.ok) {
    return apiErrorResponse(ADO_SIGN_IN_REQUIRED_MESSAGE, 401);
  }

  try {
    const result = await runHoursReport({
      auth: adoCaller.auth,
      period,
      projectIds: parsed.data.scopes.projectIds,
      teamIds: parsed.data.scopes.teamIds,
      filters: {
        personAdoId: parsed.data.personAdoId,
        roleId: parsed.data.roleId,
      },
    });

    const visibleResult = filterHoursReportByVisibility(
      result,
      new Set(parsed.data.hiddenPersons),
    );

    const projectNames = Array.from(
      new Set(visibleResult.rows.map((r) => r.projectName)),
    );

    const periodLabel = formatHoursReportPeriodLabel(period);
    const periodSlug =
      period.kind === "month" ? period.monthKey : `${period.fromIso}_a_${period.toIso}`;

    const buffer = await buildHoursReportExcel({
      projectNames,
      periodLabel,
      result: visibleResult,
    });
    const filename = buildHoursReportFilename(projectNames, periodSlug);
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
      "reports/hours/excel POST",
      cause,
      "No se pudo generar el Excel del reporte de horas.",
    );
  }
}