import { loadSprintTimesSharePayloadForRequest } from "@/lib/sprints/load-sprint-times-share-payload-for-request";
import { loadSprintSharePayloadFromRequest } from "@/lib/sprints/sprint-share-request";
import { sprintTimesShareQuerySchema } from "@/lib/schemas/sprint-times-share";
import type { SprintTimesMetrics } from "@/lib/sprints/sprint-stats-types";

type BodyPayload = { times: SprintTimesMetrics };

export async function parseSprintTimesShareQuery(req: Request) {
  const url = new URL(req.url);
  const body = req.method === "POST" ? await readJsonBody(req) : null;
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

  return {
    ok: true as const,
    data: { ...parsed.data, times: body?.times ?? null },
  };
}

async function readJsonBody(req: Request): Promise<BodyPayload | null> {
  try {
    const payload = (await req.clone().json()) as BodyPayload;
    return payload?.times ? payload : null;
  } catch {
    return null;
  }
}

export async function loadSprintTimesSharePayloadFromRequest(req: Request) {
  return loadSprintSharePayloadFromRequest(
    req,
    parseSprintTimesShareQuery,
    loadSprintTimesSharePayloadForRequest,
  );
}
