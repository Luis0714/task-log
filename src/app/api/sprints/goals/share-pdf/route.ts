import { createSprintGoalSharePdfResponse } from "@/lib/sprints/create-sprint-goal-share-pdf-response";
import {
  loadSprintGoalSharePayloadFromRequest,
  sharePayloadErrorResponse,
} from "@/lib/sprints/sprint-goal-share-request";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const loaded = await loadSprintGoalSharePayloadFromRequest(req);
    if (!loaded.ok) return loaded.response;
    return createSprintGoalSharePdfResponse(loaded.payload);
  } catch (cause) {
    return sharePayloadErrorResponse(
      "sprints/goals/share-pdf GET",
      cause,
      "No se pudo generar el PDF del objetivo del sprint.",
    );
  }
}
