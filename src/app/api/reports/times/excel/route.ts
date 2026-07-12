import { z } from "zod";

import { ADO_SIGN_IN_REQUIRED_MESSAGE } from "@/lib/auth/ado-auth-messages";
import { requireAdoCaller } from "@/lib/ado/require-ado-caller";
import { drizzleUserRepository } from "@/lib/db/adapters/drizzle/drizzle-user.repository";
import { apiErrorFromCause, apiErrorResponse } from "@/lib/errors/api-error-response";
import { buildMemberInfoMap } from "@/lib/reports/excel/member-info";
import {
  buildCombinedSprintTimesExcel,
  buildSprintTimesExcel,
} from "@/lib/reports/excel/sprint-times-excel";
import type ExcelJS from "exceljs";
import { filterSprintTimesByVisibility } from "@/lib/sprints/filter-sprint-times-by-visibility";
import { loadSprintStatsScreen } from "@/lib/sprints/load-sprint-stats-screen";

export const dynamic = "force-dynamic";

const csvOf = z
  .string()
  .optional()
  .transform((value) =>
    value
      ? value
          .split(",")
          .map((entry) => entry.trim())
          .filter((entry) => entry.length > 0)
      : [],
  );

const hiddenAssigneesSchema = csvOf;

const baseSprintShape = {
  project: z.string().min(1, "Proyecto requerido"),
  team: z.string().min(1, "Equipo requerido"),
  hiddenAssignees: hiddenAssigneesSchema,
};

const multiSprintQuerySchema = z.object({
  ...baseSprintShape,
  // Lista de sprints seleccionados (CSV: cada item es `path|name|startDate|finishDate`).
  sprints: csvOf,
  weekIndex: z.coerce.number().int().min(0).optional(),
});

type SprintSelection = {
  path: string;
  name: string;
  startDate: string | null;
  finishDate: string | null;
};

const SPRINT_PAYLOAD_SEPARATOR = "|";

function parseSprintPayload(entry: string): SprintSelection | null {
  const [path, name, startDate, finishDate] = entry.split(SPRINT_PAYLOAD_SEPARATOR);
  if (!path || !name) return null;
  return {
    path,
    name,
    startDate: startDate || null,
    finishDate: finishDate || null,
  };
}

function resolveExcelFilename(sprints: readonly SprintSelection[]): string {
  if (sprints.length === 0) return "reporte-tiempos.xlsx";
  if (sprints.length === 1) {
    const safe = (sprints[0].name || sprints[0].path)
      .replace(/[^\w\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-");
    return `reporte-tiempos-${safe}.xlsx`;
  }
  // Rango entre el primer y último sprint (orden estable del cliente).
  return `reporte-tiempos-${sprints.length}-sprints.xlsx`;
}

function xlsxResponse(buffer: ExcelJS.Buffer, filename: string): Response {
  return new Response(buffer as unknown as BodyInit, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}

export async function GET(req: Request) {
  const url = new URL(req.url);

  const parsed = multiSprintQuerySchema.safeParse({
    project: url.searchParams.get("project") ?? "",
    team: url.searchParams.get("team") ?? "",
    sprints: url.searchParams.get("sprints") ?? undefined,
    hiddenAssignees: url.searchParams.get("hiddenAssignees") ?? undefined,
    weekIndex: url.searchParams.get("weekIndex") ?? undefined,
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

  const { project, team, sprints: rawSprints, hiddenAssignees, weekIndex } = parsed.data;

  const sprintSelections = rawSprints
    .map(parseSprintPayload)
    .filter((entry): entry is SprintSelection => entry !== null);

  if (sprintSelections.length === 0) {
    return apiErrorResponse(
      "Selecciona al menos un sprint para generar el reporte.",
      400,
    );
  }

  try {
    const [neosUsers, snapshots] = await Promise.all([
      drizzleUserRepository.listAllWithRoles(),
      Promise.all(
        sprintSelections.map((sprint) =>
          loadSprintStatsScreen(
            {
              organization: caller.auth.organization,
              project,
              team,
              sprintPath: sprint.path,
            },
            {
              goalOnly: false,
              sprintStartDate: sprint.startDate ?? undefined,
              sprintFinishDate: sprint.finishDate ?? undefined,
            },
          ),
        ),
      ),
    ]);

    const memberRoles = buildMemberInfoMap(neosUsers);

    for (let i = 0; i < snapshots.length; i++) {
      const snapshot = snapshots[i];
      const sprint = sprintSelections[i];
      if (snapshot.error) {
        return apiErrorResponse(snapshot.error, 502);
      }
      if (snapshot.isFinalized) {
        return apiErrorResponse(
          `El sprint "${sprint.name}" ya fue finalizado. Accede al historial de sprints para ver sus datos.`,
          422,
        );
      }
      if (!snapshot.stats) {
        return apiErrorResponse(
          `No hay datos disponibles para el sprint "${sprint.name}".`,
          404,
        );
      }
    }

    const hiddenSet = new Set(hiddenAssignees);

    if (sprintSelections.length === 1) {
      // Compatibilidad con el flujo single-sprint existente.
      const single = sprintSelections[0];
      const stats = snapshots[0].stats!;
      const visibleTimes = filterSprintTimesByVisibility(stats.times, hiddenSet);

      const buffer = await buildSprintTimesExcel({
        sprintName: single.name,
        project,
        team,
        times: visibleTimes,
        memberRoles,
        weekIndex,
        generatedAt: new Date(),
      });

      return xlsxResponse(buffer, resolveExcelFilename(sprintSelections));
    }

    // Multi-sprint: un único workbook con una hoja "Tiempos registrados"
    // y otra "Resumen" con totales por persona a través de sprints.
    const buffer = await buildCombinedSprintTimesExcel({
      project,
      team,
      sprints: sprintSelections.map((sprint, i) => ({
        sprintName: sprint.name,
        startDate: sprint.startDate,
        finishDate: sprint.finishDate,
        times: filterSprintTimesByVisibility(
          snapshots[i].stats!.times,
          hiddenSet,
        ),
      })),
      memberRoles,
      generatedAt: new Date(),
    });

    return xlsxResponse(buffer, resolveExcelFilename(sprintSelections));
  } catch (cause) {
    return apiErrorFromCause(
      "reports/times/excel GET",
      cause,
      "No se pudo generar el reporte de tiempos.",
    );
  }
}
