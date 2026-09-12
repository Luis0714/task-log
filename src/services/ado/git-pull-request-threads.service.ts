import type {
  CreatePullRequestThreadInput,
  PullRequestThread,
  PullRequestThreadStatus,
} from "@/lib/pull-requests/thread-types";
import { pullRequestThreadsResponseSchema } from "@/lib/schemas/ado-pull-request-threads";

export type PullRequestThreadsQuery = {
  project: string;
  pullRequestId: number;
  repository?: string;
};

export type FetchPullRequestThreadsResult =
  | { ok: true; threads: PullRequestThread[] }
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

function parseThreads(payload: unknown, fallback: string): FetchPullRequestThreadsResult {
  const parsed = pullRequestThreadsResponseSchema.safeParse(payload);
  if (!parsed.success) return { ok: false, error: fallback };
  return { ok: true, threads: parsed.data.threads };
}

async function readJsonResult(
  res: Response,
  fallback: string,
): Promise<FetchPullRequestThreadsResult> {
  const payload: unknown = await res.json();
  if (!res.ok) {
    return { ok: false, error: readErrorMessage(payload, fallback) };
  }
  return parseThreads(payload, "Respuesta de comentarios inválida.");
}

export async function fetchPullRequestThreads(
  query: PullRequestThreadsQuery,
  signal?: AbortSignal,
): Promise<FetchPullRequestThreadsResult> {
  const params = new URLSearchParams({ project: query.project });
  if (query.repository) params.set("repository", query.repository);

  try {
    const res = await fetch(
      `/api/ado/git/pull-requests/${query.pullRequestId}/threads?${params}`,
      { signal },
    );
    return readJsonResult(res, "No se pudieron cargar los comentarios.");
  } catch (cause) {
    if (signal?.aborted) return { ok: false, error: "Cancelado" };
    const message =
      cause instanceof Error ? cause.message : "No se pudieron cargar los comentarios.";
    return { ok: false, error: message };
  }
}

export async function createPullRequestThreadRequest(
  query: PullRequestThreadsQuery,
  input: CreatePullRequestThreadInput,
): Promise<FetchPullRequestThreadsResult> {
  try {
    const res = await fetch(
      `/api/ado/git/pull-requests/${query.pullRequestId}/threads`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project: query.project,
          repository: query.repository,
          ...input,
        }),
      },
    );
    return readJsonResult(res, "No se pudo publicar el comentario.");
  } catch (cause) {
    const message =
      cause instanceof Error ? cause.message : "No se pudo publicar el comentario.";
    return { ok: false, error: message };
  }
}

export async function replyPullRequestThreadRequest(
  query: PullRequestThreadsQuery,
  threadId: number,
  content: string,
  parentCommentId?: number,
): Promise<FetchPullRequestThreadsResult> {
  try {
    const res = await fetch(
      `/api/ado/git/pull-requests/${query.pullRequestId}/threads/${threadId}/comments`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project: query.project,
          repository: query.repository,
          content,
          parentCommentId,
        }),
      },
    );
    return readJsonResult(res, "No se pudo responder el comentario.");
  } catch (cause) {
    const message =
      cause instanceof Error ? cause.message : "No se pudo responder el comentario.";
    return { ok: false, error: message };
  }
}

export async function updatePullRequestThreadStatusRequest(
  query: PullRequestThreadsQuery,
  threadId: number,
  status: PullRequestThreadStatus,
): Promise<FetchPullRequestThreadsResult> {
  try {
    const res = await fetch(
      `/api/ado/git/pull-requests/${query.pullRequestId}/threads/${threadId}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project: query.project,
          repository: query.repository,
          status,
        }),
      },
    );
    return readJsonResult(res, "No se pudo cambiar el estado del comentario.");
  } catch (cause) {
    const message =
      cause instanceof Error
        ? cause.message
        : "No se pudo cambiar el estado del comentario.";
    return { ok: false, error: message };
  }
}
