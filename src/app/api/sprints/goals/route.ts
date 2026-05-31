import { NextResponse } from "next/server";

import { ADO_SIGN_IN_REQUIRED_MESSAGE } from "@/lib/auth/ado-auth-messages";
import { requireAdoCaller } from "@/lib/ado/require-ado-caller";
import {
  apiErrorFromCause,
  apiErrorResponse,
} from "@/lib/errors/api-error-response";
import { USER_MESSAGES } from "@/lib/errors/user-messages";
import { sprintStoryGoalsPutBodySchema } from "@/lib/schemas/sprint-story-goals";
import { saveSprintStoryGoals } from "@/lib/sprints/save-sprint-story-goals";

export const dynamic = "force-dynamic";

export async function PUT(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiErrorResponse(USER_MESSAGES.invalidJsonBody, 400);
  }

  const parsed = sprintStoryGoalsPutBodySchema.safeParse(body);
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
    const result = await saveSprintStoryGoals(
      {
        organization: caller.auth.organization,
        project: parsed.data.project,
        team: parsed.data.team,
        sprintPath: parsed.data.sprintPath,
      },
      parsed.data.goals,
    );
    if (!result.ok) {
      return apiErrorResponse(result.message, 400);
    }

    return NextResponse.json({ ok: true });
  } catch (cause) {
    return apiErrorFromCause(
      "sprints/goals PUT",
      cause,
      "No se pudieron guardar los objetivos del sprint.",
    );
  }
}
