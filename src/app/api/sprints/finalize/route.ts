import { NextResponse } from "next/server";

import { ADO_SIGN_IN_REQUIRED_MESSAGE } from "@/lib/auth/ado-auth-messages";
import { getTaskPilotSession } from "@/lib/auth/session";
import { requireAdoCaller } from "@/lib/ado/require-ado-caller";
import {
  apiErrorFromCause,
  apiErrorResponse,
} from "@/lib/errors/api-error-response";
import { USER_MESSAGES } from "@/lib/errors/user-messages";
import { finalizeSprintSnapshotBodySchema } from "@/lib/schemas/sprint-snapshot";
import { finalizeSprintSnapshot } from "@/lib/sprints/finalize-sprint-snapshot";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiErrorResponse(USER_MESSAGES.invalidJsonBody, 400);
  }

  const parsed = finalizeSprintSnapshotBodySchema.safeParse(body);
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

  const session = await getTaskPilotSession();

  try {
    const result = await finalizeSprintSnapshot({
      scope: {
        organization: caller.auth.organization,
        project: parsed.data.project,
        team: parsed.data.team,
        sprintPath: parsed.data.sprintPath,
      },
      auth: caller.auth,
      source: parsed.data.source,
      finalizedByUserId: session.taskPilotUserId ?? null,
      finalizedByDisplayName: session.adoProfile?.displayName ?? null,
      sprintName: parsed.data.sprintName ?? null,
      sprintStartDate: parsed.data.sprintStartDate ?? null,
      sprintFinishDate: parsed.data.sprintFinishDate ?? null,
    });

    if (!result.ok) {
      return apiErrorResponse(result.message, 400);
    }

    return NextResponse.json({ ok: true, snapshot: result.snapshot });
  } catch (cause) {
    return apiErrorFromCause(
      "sprints/finalize POST",
      cause,
      "No se pudo finalizar la retrospectiva del sprint.",
    );
  }
}
