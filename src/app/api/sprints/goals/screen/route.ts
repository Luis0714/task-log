import { NextResponse } from "next/server";

import { ADO_SIGN_IN_REQUIRED_MESSAGE } from "@/lib/auth/ado-auth-messages";
import { requireAdoCaller } from "@/lib/ado/require-ado-caller";
import {
  apiErrorFromCause,
  apiErrorResponse,
} from "@/lib/errors/api-error-response";
import { USER_MESSAGES } from "@/lib/errors/user-messages";
import { sprintGoalScreenQuerySchema } from "@/lib/schemas/sprint-goal-screen";
import { loadSprintGoalScreen } from "@/lib/sprints/load-sprint-goal-screen";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const parsed = sprintGoalScreenQuerySchema.safeParse({
    project: url.searchParams.get("project") ?? "",
    team: url.searchParams.get("team") ?? "",
    sprintPath: url.searchParams.get("sprintPath") ?? "",
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
    const snapshot = await loadSprintGoalScreen({
      organization: caller.auth.organization,
      project: parsed.data.project,
      team: parsed.data.team,
      sprintPath: parsed.data.sprintPath,
    });

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
