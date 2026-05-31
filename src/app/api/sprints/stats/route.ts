import { NextResponse } from "next/server";

import { ADO_SIGN_IN_REQUIRED_MESSAGE } from "@/lib/auth/ado-auth-messages";
import { requireAdoCaller } from "@/lib/ado/require-ado-caller";
import {
  apiErrorFromCause,
  apiErrorResponse,
} from "@/lib/errors/api-error-response";
import { USER_MESSAGES } from "@/lib/errors/user-messages";
import { sprintStatsScreenQuerySchema } from "@/lib/schemas/sprint-stats-screen";
import { loadSprintStatsScreen } from "@/lib/sprints/load-sprint-stats-screen";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const parsed = sprintStatsScreenQuerySchema.safeParse({
    project: url.searchParams.get("project") ?? "",
    team: url.searchParams.get("team") ?? "",
    sprintPath: url.searchParams.get("sprintPath") ?? "",
    goalOnly: url.searchParams.get("goalOnly") ?? undefined,
    sprintStartDate: url.searchParams.get("sprintStartDate") ?? undefined,
    sprintFinishDate: url.searchParams.get("sprintFinishDate") ?? undefined,
  });

  if (!parsed.success) {
    return apiErrorResponse(
      parsed.error.issues[0]?.message ?? USER_MESSAGES.invalidForm,
      400,
    );
  }

  const caller = await requireAdoCaller();
  if (!caller.ok) {
    return apiErrorResponse(ADO_SIGN_IN_REQUIRED_MESSAGE, 401);
  }

  try {
    const snapshot = await loadSprintStatsScreen(
      {
        organization: caller.auth.organization,
        project: parsed.data.project,
        team: parsed.data.team,
        sprintPath: parsed.data.sprintPath,
      },
      {
        goalOnly: parsed.data.goalOnly,
        sprintStartDate: parsed.data.sprintStartDate,
        sprintFinishDate: parsed.data.sprintFinishDate,
      },
    );

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
