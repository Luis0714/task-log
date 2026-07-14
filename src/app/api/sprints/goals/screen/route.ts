import { NextResponse } from "next/server";

import {
  apiErrorFromCause,
  apiErrorResponse,
} from "@/lib/errors/api-error-response";
import { sprintGoalScreenQuerySchema } from "@/lib/schemas/sprint-goal-screen";
import { loadSprintGoalScreen } from "@/lib/sprints/load-sprint-goal-screen";
import { resolveSprintScopeRequest } from "@/lib/sprints/resolve-sprint-scope-request";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const resolved = await resolveSprintScopeRequest(req, sprintGoalScreenQuerySchema);
  if (!resolved.ok) {
    return resolved.response;
  }

  try {
    const snapshot = await loadSprintGoalScreen(resolved.scope);

    if (snapshot.error) {
      return apiErrorResponse(snapshot.error, 502);
    }

    return NextResponse.json({
      rows: snapshot.rows,
      backlogStates: snapshot.backlogStates,
      catalogTags: snapshot.catalogTags,
      generalObjective: snapshot.generalObjective,
      persistenceReady: snapshot.persistenceReady,
    });
  } catch (cause) {
    return apiErrorFromCause(
      "sprints/goals/screen GET",
      cause,
      "No se pudo cargar la pantalla de objetivos del sprint.",
    );
  }
}
