import { createSprintTimesShareImageResponse } from "@/lib/sprints/create-sprint-times-share-image-response";
import { loadSprintTimesSharePayloadFromRequest } from "@/lib/sprints/sprint-times-share-request";
import { sharePayloadErrorResponse as shareTimesPayloadErrorResponse } from "@/lib/sprints/sprint-share-request";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  return handleShareImage(req);
}

export async function POST(req: Request) {
  return handleShareImage(req);
}

async function handleShareImage(req: Request) {
  try {
    const loaded = await loadSprintTimesSharePayloadFromRequest(req);
    if (!loaded.ok) return loaded.response;
    return createSprintTimesShareImageResponse(loaded.payload);
  } catch (cause) {
    return shareTimesPayloadErrorResponse(
      "sprints/stats/times/share-image",
      cause,
      "No se pudo generar la imagen de tiempos del sprint.",
    );
  }
}
