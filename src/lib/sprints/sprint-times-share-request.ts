import { loadSprintTimesSharePayloadForRequest } from "@/lib/sprints/load-sprint-times-share-payload-for-request";
import {
  loadSprintSharePayloadFromRequest,
  sharePayloadErrorResponse,
} from "@/lib/sprints/sprint-share-request";
import { sprintTimesShareQuerySchema } from "@/lib/schemas/sprint-times-share";

export { sharePayloadErrorResponse as shareTimesPayloadErrorResponse };

export function parseSprintTimesShareQuery(req: Request) {
  const url = new URL(req.url);
  const parsed = sprintTimesShareQuerySchema.safeParse({
    project: url.searchParams.get("project") ?? "",
    team: url.searchParams.get("team") ?? "",
    sprintPath: url.searchParams.get("sprintPath") ?? "",
    sprintName: url.searchParams.get("sprintName") ?? "",
    sprintStartDate: url.searchParams.get("sprintStartDate") ?? undefined,
    sprintFinishDate: url.searchParams.get("sprintFinishDate") ?? undefined,
    goalOnly: url.searchParams.get("goalOnly") ?? undefined,
    variant: url.searchParams.get("variant") ?? undefined,
  });

  if (!parsed.success) {
    return {
      ok: false as const,
      errorMessage: parsed.error.issues[0]?.message,
    };
  }

  return { ok: true as const, data: parsed.data };
}

export async function loadSprintTimesSharePayloadFromRequest(req: Request) {
  return loadSprintSharePayloadFromRequest(
    req,
    parseSprintTimesShareQuery,
    loadSprintTimesSharePayloadForRequest,
  );
}
