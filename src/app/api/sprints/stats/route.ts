import { NextResponse } from "next/server";

import {
  apiErrorFromCause,
  apiErrorResponse,
} from "@/lib/errors/api-error-response";
import { sprintStatsScreenQuerySchema } from "@/lib/schemas/sprint-stats-screen";
import { loadSprintStatsScreen } from "@/lib/sprints/load-sprint-stats-screen";
import { resolveSprintScopeRequest } from "@/lib/sprints/resolve-sprint-scope-request";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const resolved = await resolveSprintScopeRequest(req, sprintStatsScreenQuerySchema, [
    "goalOnly",
    "sprintStartDate",
    "sprintFinishDate",
  ]);
  if (!resolved.ok) {
    return resolved.response;
  }

  try {
    const snapshot = await loadSprintStatsScreen(resolved.scope, {
      goalOnly: resolved.query.goalOnly,
      sprintStartDate: resolved.query.sprintStartDate,
      sprintFinishDate: resolved.query.sprintFinishDate,
    });

    if (snapshot.error) {
      return apiErrorResponse(snapshot.error, 502);
    }

    return NextResponse.json({
      stats: snapshot.stats,
      persistenceReady: snapshot.persistenceReady,
      isFinalized: snapshot.isFinalized,
    });
  } catch (cause) {
    return apiErrorFromCause(
      "sprints/stats GET",
      cause,
      "No se pudo cargar las estadísticas del sprint.",
    );
  }
}
