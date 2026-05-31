import type { SprintSnapshotData } from "@/lib/sprints/sprint-snapshot-types";
import { parseSprintSnapshotFromApi } from "@/lib/sprints/parse-sprint-snapshot-api";

export type SprintSnapshotQuery = {
  project: string;
  team: string;
  sprintPath: string;
};

export type SprintSnapshotScreenResponse = {
  snapshot: SprintSnapshotData | null;
  persistenceReady: boolean;
};

export type FinalizeSprintSnapshotPayload = SprintSnapshotQuery & {
  source?: "manual" | "auto";
  sprintName?: string;
  sprintStartDate?: string;
  sprintFinishDate?: string;
};

export type FinalizeSprintSnapshotResponse =
  | { ok: true; snapshot: SprintSnapshotData }
  | { ok: false; errorMessage: string };

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

export async function fetchSprintSnapshot(
  query: SprintSnapshotQuery,
  signal?: AbortSignal,
): Promise<SprintSnapshotScreenResponse> {
  const params = new URLSearchParams({
    project: query.project,
    team: query.team,
    sprintPath: query.sprintPath,
  });

  const res = await fetch(`/api/sprints/snapshot?${params.toString()}`, { signal });
  const payload: unknown = await res.json();

  if (!res.ok) {
    throw new Error(readApiError(payload, "No se pudo cargar la retrospectiva del sprint."));
  }

  const data = payload as SprintSnapshotScreenResponse;
  return {
    snapshot: parseSprintSnapshotFromApi(data.snapshot),
    persistenceReady: Boolean(data.persistenceReady),
  };
}

export async function finalizeSprintSnapshot(
  payload: FinalizeSprintSnapshotPayload,
): Promise<FinalizeSprintSnapshotResponse> {
  const res = await fetch("/api/sprints/finalize", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const body = (await res.json()) as {
    error?: string;
    snapshot?: SprintSnapshotData;
  };

  if (res.ok && body.snapshot) {
    const snapshot = parseSprintSnapshotFromApi(body.snapshot);
    if (snapshot) {
      return { ok: true, snapshot };
    }
  }

  return {
    ok: false,
    errorMessage: body.error ?? "No se pudo finalizar la retrospectiva del sprint.",
  };
}
