import type { GitChangeset, GitFileChange } from "@/lib/git/changeset";
import {
  gitCompareResponseSchema,
  gitFileDiffResponseSchema,
} from "@/lib/schemas/git-compare";

export type GitCompareQuery = {
  project: string;
  repository: string;
  source: string;
  target: string;
};

export type GitFileDiffQuery = GitCompareQuery & {
  path: string;
};

export type FetchGitCompareResult =
  | { ok: true; changeset: GitChangeset }
  | { ok: false; error: string };

export type FetchGitFileDiffResult =
  | { ok: true; file: GitFileChange }
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

export async function fetchGitCompare(
  query: GitCompareQuery,
  signal?: AbortSignal,
): Promise<FetchGitCompareResult> {
  const params = new URLSearchParams(query);

  try {
    const res = await fetch(`/api/ado/git/compare?${params.toString()}`, { signal });
    const payload: unknown = await res.json();

    if (!res.ok) {
      return { ok: false, error: readErrorMessage(payload, "No se pudo comparar las ramas.") };
    }

    const parsed = gitCompareResponseSchema.safeParse(payload);
    if (!parsed.success) {
      return { ok: false, error: "Respuesta de comparación inválida." };
    }

    return { ok: true, changeset: parsed.data };
  } catch (cause) {
    if (signal?.aborted) {
      return { ok: true, changeset: { commits: [], files: [], commonCommit: null, sourceCommit: null } };
    }
    const message =
      cause instanceof Error ? cause.message : "No se pudo comparar las ramas.";
    return { ok: false, error: message };
  }
}

export async function fetchGitFileDiff(
  query: GitFileDiffQuery,
  signal?: AbortSignal,
): Promise<FetchGitFileDiffResult> {
  const params = new URLSearchParams(query);

  try {
    const res = await fetch(`/api/ado/git/file-diff?${params.toString()}`, { signal });
    const payload: unknown = await res.json();

    if (!res.ok) {
      return { ok: false, error: readErrorMessage(payload, "No se pudo cargar el diff.") };
    }

    const parsed = gitFileDiffResponseSchema.safeParse(payload);
    if (!parsed.success) {
      return { ok: false, error: "Respuesta de diff inválida." };
    }

    return { ok: true, file: parsed.data.file };
  } catch (cause) {
    if (signal?.aborted) {
      return { ok: false, error: "Cancelado" };
    }
    const message = cause instanceof Error ? cause.message : "No se pudo cargar el diff.";
    return { ok: false, error: message };
  }
}
