import type {
  PullRequestDetail,
  PullRequestMutation,
} from "@/lib/pull-requests/detail-types";
import { pullRequestDetailSchema } from "@/lib/schemas/git-pull-request-detail";

export type FetchPullRequestDetailQuery = {
  project: string;
  pullRequestId: number;
  repository?: string;
};

export type FetchPullRequestDetailResult =
  | { ok: true; detail: PullRequestDetail }
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

function parseDetail(payload: unknown, fallback: string): FetchPullRequestDetailResult {
  const parsed = pullRequestDetailSchema.safeParse(payload);
  if (!parsed.success) {
    return { ok: false, error: fallback };
  }
  return { ok: true, detail: parsed.data };
}

export async function fetchPullRequestDetail(
  query: FetchPullRequestDetailQuery,
  signal?: AbortSignal,
): Promise<FetchPullRequestDetailResult> {
  const params = new URLSearchParams({ project: query.project });
  if (query.repository) params.set("repository", query.repository);

  try {
    const res = await fetch(
      `/api/ado/git/pull-requests/${query.pullRequestId}?${params}`,
      { signal },
    );
    const payload: unknown = await res.json();
    if (!res.ok) {
      return {
        ok: false,
        error: readErrorMessage(payload, "No se pudo cargar el pull request."),
      };
    }
    return parseDetail(payload, "Respuesta de detalle inválida.");
  } catch (cause) {
    if (signal?.aborted) {
      return { ok: false, error: "Cancelado" };
    }
    const message =
      cause instanceof Error ? cause.message : "No se pudo cargar el pull request.";
    return { ok: false, error: message };
  }
}

export async function updatePullRequestRequest(
  query: FetchPullRequestDetailQuery,
  mutation: PullRequestMutation,
): Promise<FetchPullRequestDetailResult> {
  try {
    const res = await fetch(`/api/ado/git/pull-requests/${query.pullRequestId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...mutation,
        project: query.project,
        repository: query.repository,
      }),
    });
    const payload: unknown = await res.json();
    if (!res.ok) {
      return {
        ok: false,
        error: readErrorMessage(payload, "No se pudo actualizar el pull request."),
      };
    }
    return parseDetail(payload, "Respuesta de actualización inválida.");
  } catch (cause) {
    const message =
      cause instanceof Error ? cause.message : "No se pudo actualizar el pull request.";
    return { ok: false, error: message };
  }
}
