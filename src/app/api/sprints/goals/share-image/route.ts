import { createSprintGoalShareImageResponse } from "@/lib/sprints/create-sprint-goal-share-image-response";
import {
  loadSprintGoalSharePayloadFromRequest,
  sharePayloadErrorResponse,
} from "@/lib/sprints/sprint-goal-share-request";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const loaded = await loadSprintGoalSharePayloadFromRequest(req);
    if (!loaded.ok) return loaded.response;
    return createSprintGoalShareImageResponse(loaded.payload);
  } catch (cause) {
    return sharePayloadErrorResponse(
      "sprints/goals/share-image GET",
      cause,
      "No se pudo generar la imagen del objetivo del sprint.",
    );
  }
}
