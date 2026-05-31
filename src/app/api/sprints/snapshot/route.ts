import { NextResponse } from "next/server";

import { ADO_SIGN_IN_REQUIRED_MESSAGE } from "@/lib/auth/ado-auth-messages";
import { requireAdoCaller } from "@/lib/ado/require-ado-caller";
import {
  apiErrorFromCause,
  apiErrorResponse,
} from "@/lib/errors/api-error-response";
import { USER_MESSAGES } from "@/lib/errors/user-messages";
import { sprintSnapshotQuerySchema } from "@/lib/schemas/sprint-snapshot";
import { loadSprintSnapshotScreen } from "@/lib/sprints/load-sprint-snapshot-screen";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const parsed = sprintSnapshotQuerySchema.safeParse({
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
    const screen = await loadSprintSnapshotScreen({
      organization: caller.auth.organization,
      project: parsed.data.project,
      team: parsed.data.team,
      sprintPath: parsed.data.sprintPath,
    });

    if (screen.error) {
      return apiErrorResponse(screen.error, 502);
    }

    return NextResponse.json({
      snapshot: screen.snapshot,
      persistenceReady: screen.persistenceReady,
    });
  } catch (cause) {
    return apiErrorFromCause(
      "sprints/snapshot GET",
      cause,
      "No se pudo cargar la retrospectiva del sprint.",
    );
  }
}
