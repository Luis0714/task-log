import { z } from "zod";

import { ADO_SIGN_IN_REQUIRED_MESSAGE } from "@/lib/auth/ado-auth-messages";
import { requireAdoCaller } from "@/lib/ado/require-ado-caller";
import { drizzleUserRepository } from "@/lib/db/adapters/drizzle/drizzle-user.repository";
import { apiErrorFromCause, apiErrorResponse } from "@/lib/errors/api-error-response";
import { buildMemberInfoMap } from "@/lib/reports/excel/member-info";
import { buildSprintTimesExcel } from "@/lib/reports/excel/sprint-times-excel";
import { filterSprintTimesByVisibility } from "@/lib/sprints/filter-sprint-times-by-visibility";
import { loadSprintStatsScreen } from "@/lib/sprints/load-sprint-stats-screen";

export const dynamic = "force-dynamic";

const querySchema = z.object({
  project: z.string().min(1, "Proyecto requerido"),
  team: z.string().min(1, "Equipo requerido"),
  sprintPath: z.string().min(1, "Sprint requerido"),
  sprintName: z.string().min(1, "Nombre de sprint requerido"),
  sprintStartDate: z.string().optional(),
  sprintFinishDate: z.string().optional(),
  weekIndex: z.coerce.number().int().min(0).optional(),
  hiddenAssignees: z
    .string()
    .optional()
    .transform((value) =>
      value
        ? value
            .split(",")
            .map((entry) => entry.trim())
            .filter((entry) => entry.length > 0)
        : [],
    ),
});

export async function GET(req: Request) {
  const url = new URL(req.url);

  const parsed = querySchema.safeParse({
    project: url.searchParams.get("project") ?? "",
    team: url.searchParams.get("team") ?? "",
    sprintPath: url.searchParams.get("sprintPath") ?? "",
    sprintName: url.searchParams.get("sprintName") ?? "",
    sprintStartDate: url.searchParams.get("sprintStartDate") ?? undefined,
    sprintFinishDate: url.searchParams.get("sprintFinishDate") ?? undefined,
    weekIndex: url.searchParams.get("weekIndex") ?? undefined,
    hiddenAssignees: url.searchParams.get("hiddenAssignees") ?? undefined,
  });

  if (!parsed.success) {
    return apiErrorResponse(
      parsed.error.issues[0]?.message ?? "Parámetros inválidos.",
      400,
    );
  }

  const caller = await requireAdoCaller();
  if (!caller.ok) {
    return apiErrorResponse(ADO_SIGN_IN_REQUIRED_MESSAGE, 401);
  }

  const {
    project,
    team,
    sprintPath,
    sprintName,
    sprintStartDate,
    sprintFinishDate,
    weekIndex,
    hiddenAssignees,
  } = parsed.data;

  try {
    const [snapshot, neosUsers] = await Promise.all([
      loadSprintStatsScreen(
        { organization: caller.auth.organization, project, team, sprintPath },
        { goalOnly: false, sprintStartDate, sprintFinishDate },
      ),
      drizzleUserRepository.listAllWithRoles(),
    ]);

    const memberRoles = buildMemberInfoMap(neosUsers);

    if (snapshot.error) {
      return apiErrorResponse(snapshot.error, 502);
    }

    if (snapshot.isFinalized) {
      return apiErrorResponse(
        "Este sprint ya fue finalizado. Accede al historial de sprints para ver sus datos.",
        422,
      );
    }

    if (!snapshot.stats) {
      return apiErrorResponse("No hay datos disponibles para este sprint.", 404);
    }

    const visibleTimes = filterSprintTimesByVisibility(
      snapshot.stats.times,
      new Set(hiddenAssignees ?? []),
    );

    const buffer = await buildSprintTimesExcel({
      sprintName,
      project,
      team,
      times: visibleTimes,
      memberRoles,
      weekIndex,
      generatedAt: new Date(),
    });

    const safeSprintName = sprintName.replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-");
    const filename = `reporte-tiempos-${safeSprintName}.xlsx`;

    return new Response(buffer as unknown as BodyInit, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (cause) {
    return apiErrorFromCause(
      "reports/times/excel GET",
      cause,
      "No se pudo generar el reporte de tiempos.",
    );
  }
}
