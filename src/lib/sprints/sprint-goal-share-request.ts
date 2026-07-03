import { loadSprintGoalSharePayloadForRequest } from "@/lib/sprints/load-sprint-goal-share-payload-for-request";
import {
  loadSprintSharePayloadFromRequest,
  sharePayloadErrorResponse,
} from "@/lib/sprints/sprint-share-request";
import { sprintGoalShareQuerySchema } from "@/lib/schemas/sprint-goal-share";

export { sharePayloadErrorResponse };

export function parseSprintGoalShareQuery(req: Request) {
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
    return {
      ok: false as const,
      errorMessage: parsed.error.issues[0]?.message,
    };
  }

  return { ok: true as const, data: parsed.data };
}

export async function loadSprintGoalSharePayloadFromRequest(req: Request) {
  return loadSprintSharePayloadFromRequest(
    req,
    parseSprintGoalShareQuery,
    loadSprintGoalSharePayloadForRequest,
  );
}
