import type {
  AdoTaskStateDto,
  AdoWorkItemTagDto,
} from "@/lib/schemas/ado-catalog";
import type { SprintStoryGoalRowModel } from "@/lib/sprints/sprint-story-goal";
import type { SprintStoryGoalDraftDto } from "@/lib/schemas/sprint-story-goals";

export type SprintGoalScreenQuery = {
  project: string;
  team: string;
  sprintPath: string;
};

export type SprintGoalScreenResponse = {
  rows: SprintStoryGoalRowModel[];
  backlogStates: AdoTaskStateDto[];
  catalogTags: AdoWorkItemTagDto[];
  persistenceReady: boolean;
};

export type SaveSprintStoryGoalsPayload = SprintGoalScreenQuery & {
  goals: SprintStoryGoalDraftDto[];
};

export type SaveSprintStoryGoalsResponse =
  | { ok: true }
  | { ok: false; errorMessage: string };

type SprintGoalScreenApiResponse = SprintGoalScreenResponse;

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

export async function fetchSprintGoalScreen(
  query: SprintGoalScreenQuery,
  signal?: AbortSignal,
): Promise<SprintGoalScreenResponse> {
  const params = new URLSearchParams({
    project: query.project,
    team: query.team,
    sprintPath: query.sprintPath,
  });

  const res = await fetch(`/api/sprints/goals/screen?${params.toString()}`, { signal });
  const payload: unknown = await res.json();

  if (!res.ok) {
    throw new Error(readApiError(payload, "No se pudo cargar la pantalla de objetivos."));
  }

  const data = payload as SprintGoalScreenApiResponse;
  return {
    rows: data.rows ?? [],
    backlogStates: data.backlogStates ?? [],
    catalogTags: data.catalogTags ?? [],
    persistenceReady: Boolean(data.persistenceReady),
  };
}

export async function saveSprintStoryGoals(
  payload: SaveSprintStoryGoalsPayload,
): Promise<SaveSprintStoryGoalsResponse> {
  const res = await fetch("/api/sprints/goals", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const body = (await res.json()) as { error?: string };

  if (res.ok) return { ok: true };
  return {
    ok: false,
    errorMessage: body.error ?? "No se pudieron guardar los objetivos del sprint.",
  };
}
