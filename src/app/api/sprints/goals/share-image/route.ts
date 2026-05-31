import { ADO_SIGN_IN_REQUIRED_MESSAGE } from "@/lib/auth/ado-auth-messages";
import { requireAdoCaller } from "@/lib/ado/require-ado-caller";
import {
  apiErrorFromCause,
  apiErrorResponse,
} from "@/lib/errors/api-error-response";
import { USER_MESSAGES } from "@/lib/errors/user-messages";
import { buildSprintGoalSharePayloadFromRows } from "@/lib/sprints/build-sprint-goal-share-payload";
import { createSprintGoalShareImageResponse } from "@/lib/sprints/create-sprint-goal-share-image-response";
import { loadSprintGoalScreen } from "@/lib/sprints/load-sprint-goal-screen";
import { sprintGoalShareQuerySchema } from "@/lib/schemas/sprint-goal-share";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const parsed = sprintGoalShareQuerySchema.safeParse({
    project: url.searchParams.get("project") ?? "",
    team: url.searchParams.get("team") ?? "",
    sprintPath: url.searchParams.get("sprintPath") ?? "",
    sprintName: url.searchParams.get("sprintName") ?? "",
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
    const snapshot = await loadSprintGoalScreen({
      organization: caller.auth.organization,
      project: parsed.data.project,
      team: parsed.data.team,
      sprintPath: parsed.data.sprintPath,
    });

    if (snapshot.error) {
      return apiErrorResponse(snapshot.error, 502);
    }

    const payload = buildSprintGoalSharePayloadFromRows(snapshot.rows, {
      projectName: parsed.data.project,
      teamName: parsed.data.team,
      sprintName: parsed.data.sprintName,
      sprintStartDate: parsed.data.sprintStartDate,
      sprintFinishDate: parsed.data.sprintFinishDate,
      generalObjective: snapshot.generalObjective,
    });

    if (!payload) {
      return apiErrorResponse(
        "No hay historias con objetivo guardado para compartir.",
        404,
      );
    }

    return createSprintGoalShareImageResponse(payload);
  } catch (cause) {
    return apiErrorFromCause(
      "sprints/goals/share-image GET",
      cause,
      "No se pudo generar la imagen del objetivo del sprint.",
    );
  }
}
