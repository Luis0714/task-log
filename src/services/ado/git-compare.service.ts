import type { GitChangeset, GitFileChange } from "@/lib/git/changeset";
import { consumeNdjson } from "@/lib/git/consume-ndjson";
import { resolveFileDiffPaths } from "@/lib/git/is-git-file-path";
import {
  gitCompareResponseSchema,
  gitFileDiffResponseSchema,
  gitFileDiffStreamEventSchema,
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

export type GitFileDiffsQuery = GitCompareQuery & {
  paths: readonly string[];
  priorityPath?: string | null;
};

export type StreamGitFileDiffsHandlers = {
  onFile: (file: GitFileChange) => void;
  onError: (path: string, error: string) => void;
};

export type FetchGitCompareResult =
  | { ok: true; changeset: GitChangeset }
  | { ok: false; error: string };

export type FetchGitFileDiffResult =
  | { ok: true; file: GitFileChange }
  | { ok: false; error: string };

export type FetchGitFileDiffsResult = { ok: true } | { ok: false; error: string };

function parseFileDiffStreamLine(
  line: string,
  handlers: StreamGitFileDiffsHandlers,
): void {
  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(line);
  } catch {
    return;
  }
  const parsed = gitFileDiffStreamEventSchema.safeParse(parsedJson);
  if (!parsed.success) return;
  if ("file" in parsed.data) {
    handlers.onFile(parsed.data.file);
    return;
  }
  handlers.onError(parsed.data.path, parsed.data.error);
}

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

export async function streamGitFileDiffs(
  query: GitFileDiffsQuery,
  handlers: StreamGitFileDiffsHandlers,
  signal?: AbortSignal,
): Promise<FetchGitFileDiffsResult> {
  const paths = resolveFileDiffPaths(query.paths, query.priorityPath);
  if (paths.length === 0) return { ok: true };

  try {
    const res = await fetch("/api/ado/git/file-diffs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        project: query.project,
        repository: query.repository,
        source: query.source,
        target: query.target,
        paths,
        priorityPath: query.priorityPath ?? undefined,
      }),
      signal,
    });

    if (!res.ok) {
      const payload: unknown = await res.json().catch(() => null);
      return {
        ok: false,
        error: readErrorMessage(payload, "No se pudieron cargar los diffs."),
      };
    }

    if (!res.body) {
      return { ok: false, error: "No se recibió el stream de diffs." };
    }

    await consumeNdjson(
      res.body,
      (line) => parseFileDiffStreamLine(line, handlers),
      signal,
    );

    return { ok: true };
  } catch (cause) {
    if (signal?.aborted) {
      return { ok: false, error: "Cancelado" };
    }
    const message =
      cause instanceof Error ? cause.message : "No se pudieron cargar los diffs.";
    return { ok: false, error: message };
  }
}
