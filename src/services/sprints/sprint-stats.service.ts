import type { SprintStatsScreenData } from "@/lib/sprints/sprint-stats-types";
import { normalizeSprintStatsScreenData } from "@/lib/sprints/normalize-sprint-stats";

export type SprintStatsQuery = {
  project: string;
  team: string;
  sprintPath: string;
  goalOnly?: boolean;
  sprintStartDate?: string;
  sprintFinishDate?: string;
};

export type SprintStatsScreenResponse = {
  stats: SprintStatsScreenData | null;
  persistenceReady: boolean;
  isFinalized: boolean;
};

function readApiError(payload: unknown, fallback: string): string {
  if (
    typeof payload === "object" &&
    payload !== null &&
    "error" in payload &&
    typeof payload.error === "string"
  ) {
    return payload.error;
  }
  return fallback;
}

export async function fetchSprintStats(
  query: SprintStatsQuery,
  signal?: AbortSignal,
): Promise<SprintStatsScreenResponse> {
  const params = new URLSearchParams({
    project: query.project,
    team: query.team,
    sprintPath: query.sprintPath,
  });

  if (query.goalOnly) {
    params.set("goalOnly", "true");
  }

  if (query.sprintStartDate) {
    params.set("sprintStartDate", query.sprintStartDate);
  }

  if (query.sprintFinishDate) {
    params.set("sprintFinishDate", query.sprintFinishDate);
  }

  const res = await fetch(`/api/sprints/stats?${params.toString()}`, { signal });
  const payload: unknown = await res.json();

  if (!res.ok) {
    throw new Error(readApiError(payload, "No se pudo cargar las estadísticas del sprint."));
  }

  return {
    ...(payload as SprintStatsScreenResponse),
    stats: normalizeSprintStatsScreenData((payload as SprintStatsScreenResponse).stats),
  };
}
