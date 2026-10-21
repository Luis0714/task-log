import {
  reviewTimesResponseSchema,
  type ReviewTimesQuery,
  type ReviewTimesResponse,
} from "@/lib/schemas/review-times";

export type FetchReviewTimesResult =
  | { ok: true; report: ReviewTimesResponse }
  | { ok: false; error: string };

function readErrorMessage(payload: unknown, fallback: string): string {
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

export async function fetchReviewTimes(
  query: ReviewTimesQuery,
  signal?: AbortSignal,
): Promise<FetchReviewTimesResult> {
  const params = new URLSearchParams({
    project: query.project,
    monthKey: query.monthKey,
  });
  for (const repository of query.repositories) {
    params.append("repository", repository);
  }

  try {
    const res = await fetch(`/api/ado/reports/review-times?${params.toString()}`, { signal });
    const payload: unknown = await res.json();
    if (!res.ok) {
      return {
        ok: false,
        error: readErrorMessage(payload, "No se pudieron calcular los tiempos de revisión."),
      };
    }

    const parsed = reviewTimesResponseSchema.safeParse(payload);
    if (!parsed.success) {
      return { ok: false, error: "Respuesta de tiempos de revisión inválida." };
    }
    return { ok: true, report: parsed.data };
  } catch (cause) {
    if (signal?.aborted) return { ok: false, error: "" };
    const message =
      cause instanceof Error ? cause.message : "No se pudieron calcular los tiempos de revisión.";
    return { ok: false, error: message };
  }
}
