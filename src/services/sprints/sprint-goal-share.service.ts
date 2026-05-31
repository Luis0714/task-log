export type SprintGoalShareQuery = {
  project: string;
  team: string;
  sprintPath: string;
  sprintName: string;
  sprintStartDate?: string;
  sprintFinishDate?: string;
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

export function buildSprintGoalShareImageUrl(query: SprintGoalShareQuery): string {
  const params = new URLSearchParams({
    project: query.project.trim(),
    team: query.team.trim(),
    sprintPath: query.sprintPath.trim(),
    sprintName: query.sprintName.trim(),
  });

  if (query.sprintStartDate?.trim()) {
    params.set("sprintStartDate", query.sprintStartDate.trim());
  }

  if (query.sprintFinishDate?.trim()) {
    params.set("sprintFinishDate", query.sprintFinishDate.trim());
  }

  return `/api/sprints/goals/share-image?${params.toString()}`;
}

export async function fetchSprintGoalShareImageBlob(
  query: SprintGoalShareQuery,
  signal?: AbortSignal,
): Promise<Blob> {
  const res = await fetch(buildSprintGoalShareImageUrl(query), { signal });

  if (!res.ok) {
    const contentType = res.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      const payload: unknown = await res.json();
      throw new Error(readApiError(payload, "No se pudo generar la imagen."));
    }

    throw new Error(
      res.status === 500
        ? "Error del servidor al generar la imagen. Inténtalo de nuevo."
        : "No se pudo generar la imagen del objetivo del sprint.",
    );
  }

  return res.blob();
}
