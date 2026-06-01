import type { SprintGoalShareFormat } from "@/lib/sprints/sprint-goal-share-format";
import { getSprintGoalShareMimeType } from "@/lib/sprints/sprint-goal-share-format";
import {
  appendSprintShareScopeParams,
  type SprintShareScope,
} from "@/lib/sprints/sprint-share-scope";
import { fetchShareBlob } from "@/lib/sprints/share-fetch";

export type SprintGoalShareQuery = SprintShareScope;

function buildSprintGoalShareSearchParams(query: SprintGoalShareQuery): URLSearchParams {
  return appendSprintShareScopeParams(new URLSearchParams(), query);
}

function getSprintGoalShareEndpoint(format: SprintGoalShareFormat): string {
  return format === "pdf"
    ? "/api/sprints/goals/share-pdf"
    : "/api/sprints/goals/share-image";
}

export function buildSprintGoalShareUrl(
  query: SprintGoalShareQuery,
  format: SprintGoalShareFormat,
): string {
  return `${getSprintGoalShareEndpoint(format)}?${buildSprintGoalShareSearchParams(query).toString()}`;
}

/** @deprecated Usar buildSprintGoalShareUrl(query, "image") */
export function buildSprintGoalShareImageUrl(query: SprintGoalShareQuery): string {
  return buildSprintGoalShareUrl(query, "image");
}

export async function fetchSprintGoalShareBlob(
  query: SprintGoalShareQuery,
  format: SprintGoalShareFormat,
  signal?: AbortSignal,
): Promise<Blob> {
  const fallbackMessage =
    format === "pdf"
      ? "No se pudo generar el PDF del objetivo del sprint."
      : "No se pudo generar la imagen del objetivo del sprint.";

  return fetchShareBlob({
    url: buildSprintGoalShareUrl(query, format),
    signal,
    fallbackMessage,
    expectedMimeType: getSprintGoalShareMimeType(format),
    serverErrorLabel: format === "pdf" ? "PDF" : "imagen",
  });
}

/** @deprecated Usar fetchSprintGoalShareBlob(query, "image") */
export async function fetchSprintGoalShareImageBlob(
  query: SprintGoalShareQuery,
  signal?: AbortSignal,
): Promise<Blob> {
  return fetchSprintGoalShareBlob(query, "image", signal);
}
