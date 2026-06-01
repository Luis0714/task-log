import type { SprintTimesShareVariant } from "@/lib/sprints/sprint-times-share-variant";
import {
  appendSprintShareScopeParams,
  type SprintShareScope,
} from "@/lib/sprints/sprint-share-scope";
import { fetchShareBlob } from "@/lib/sprints/share-fetch";

export type SprintTimesShareQuery = SprintShareScope & {
  goalOnly: boolean;
  variant: SprintTimesShareVariant;
};

function buildSprintTimesShareSearchParams(query: SprintTimesShareQuery): URLSearchParams {
  const params = appendSprintShareScopeParams(new URLSearchParams(), query);
  params.set("goalOnly", query.goalOnly ? "true" : "false");
  params.set("variant", query.variant);
  return params;
}

export function buildSprintTimesShareImageUrl(query: SprintTimesShareQuery): string {
  return `/api/sprints/stats/times/share-image?${buildSprintTimesShareSearchParams(query).toString()}`;
}

export async function fetchSprintTimesShareImageBlob(
  query: SprintTimesShareQuery,
  signal?: AbortSignal,
): Promise<Blob> {
  const fallbackMessage = "No se pudo generar la imagen de tiempos del sprint.";

  return fetchShareBlob({
    url: buildSprintTimesShareImageUrl(query),
    signal,
    fallbackMessage,
    expectedMimeType: "image/png",
    serverErrorLabel: "imagen",
  });
}
