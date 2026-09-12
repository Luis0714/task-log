import {
  createPullRequestResponseSchema,
  pullRequestListResponseSchema,
  type CreatePullRequestBody,
  type CreatePullRequestResponse,
} from "@/lib/schemas/git-pull-request";
import type {
  PullRequestLifecycleStatus,
  PullRequestListItem,
} from "@/lib/pull-requests/types";

export type CreatePullRequestResult =
  | { ok: true; pullRequest: CreatePullRequestResponse }
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

export type FetchPullRequestListResult =
  | { ok: true; items: PullRequestListItem[]; activeCount: number }
  | { ok: false; error: string };

export type FetchPullRequestListQuery = {
  project: string;
  status: PullRequestLifecycleStatus;
  repository?: string;
};

export async function fetchPullRequestList(
  query: FetchPullRequestListQuery,
  signal?: AbortSignal,
): Promise<FetchPullRequestListResult> {
  const params = new URLSearchParams({
    project: query.project,
    status: query.status,
  });
  if (query.repository) params.set("repository", query.repository);

  try {
    const res = await fetch(`/api/ado/git/pull-requests?${params.toString()}`, { signal });
    const payload: unknown = await res.json();

    if (!res.ok) {
      return {
        ok: false,
        error: readErrorMessage(payload, "No se pudieron cargar los pull requests."),
      };
    }

    const parsed = pullRequestListResponseSchema.safeParse(payload);
    if (!parsed.success) {
      return { ok: false, error: "Respuesta de listado inválida." };
    }

    return { ok: true, items: parsed.data.items, activeCount: parsed.data.activeCount };
  } catch (cause) {
    if (signal?.aborted) {
      return { ok: true, items: [], activeCount: 0 };
    }
    const message =
      cause instanceof Error ? cause.message : "No se pudieron cargar los pull requests.";
    return { ok: false, error: message };
  }
}

export async function createPullRequestRequest(
  body: CreatePullRequestBody,
): Promise<CreatePullRequestResult> {
  try {
    const res = await fetch("/api/ado/git/pull-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const payload: unknown = await res.json();

    if (!res.ok) {
      return {
        ok: false,
        error: readErrorMessage(payload, "No se pudo crear el pull request."),
      };
    }

    const parsed = createPullRequestResponseSchema.safeParse(payload);
    if (!parsed.success) {
      return { ok: false, error: "Respuesta de creación inválida." };
    }

    return { ok: true, pullRequest: parsed.data };
  } catch (cause) {
    const message =
      cause instanceof Error ? cause.message : "No se pudo crear el pull request.";
    return { ok: false, error: message };
  }
}
