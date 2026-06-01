import "server-only";

import type { SprintGoalShareQueryDto } from "@/lib/schemas/sprint-goal-share";
import { buildSprintGoalSharePayloadFromRows } from "@/lib/sprints/build-sprint-goal-share-payload";
import { loadSprintGoalScreen } from "@/lib/sprints/load-sprint-goal-screen";
import type { SprintGoalSharePayload } from "@/lib/sprints/sprint-goal-share-types";

export type LoadSprintGoalSharePayloadResult =
  | { ok: true; payload: SprintGoalSharePayload }
  | { ok: false; error: string; status: number };

export async function loadSprintGoalSharePayloadForRequest(
  organization: string,
  query: SprintGoalShareQueryDto,
): Promise<LoadSprintGoalSharePayloadResult> {
  const snapshot = await loadSprintGoalScreen({
    organization,
    project: query.project,
    team: query.team,
    sprintPath: query.sprintPath,
  });

  if (snapshot.error) {
    return { ok: false, error: snapshot.error, status: 502 };
  }

  const payload = buildSprintGoalSharePayloadFromRows(snapshot.rows, {
    projectName: query.project,
    teamName: query.team,
    sprintName: query.sprintName,
    sprintStartDate: query.sprintStartDate,
    sprintFinishDate: query.sprintFinishDate,
    generalObjective: snapshot.generalObjective,
  });

  if (!payload) {
    return {
      ok: false,
      error: "No hay historias con objetivo guardado para compartir.",
      status: 404,
    };
  }

  return { ok: true, payload };
}
