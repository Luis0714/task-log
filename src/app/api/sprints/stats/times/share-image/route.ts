import { createSprintTimesShareImageResponse } from "@/lib/sprints/create-sprint-times-share-image-response";
import {
  loadSprintTimesSharePayloadFromRequest,
  shareTimesPayloadErrorResponse,
} from "@/lib/sprints/sprint-times-share-request";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const loaded = await loadSprintTimesSharePayloadFromRequest(req);
    if (!loaded.ok) return loaded.response;
    return createSprintTimesShareImageResponse(loaded.payload);
  } catch (cause) {
    return shareTimesPayloadErrorResponse(
      "sprints/stats/times/share-image GET",
      cause,
      "No se pudo generar la imagen de tiempos del sprint.",
    );
  }
}
