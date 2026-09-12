import "server-only";

import type { GitFileChange } from "@/lib/git/changeset";
import {
  loadFileDiffWithContext,
  type FileDiffContext,
} from "@/lib/git/load-file-diff";

const DIFF_CONCURRENCY = 6;

type FileDiffStreamEvent =
  | { file: GitFileChange }
  | { path: string; error: string };

async function runPool<T>(
  items: readonly T[],
  limit: number,
  worker: (item: T) => Promise<void>,
): Promise<void> {
  if (items.length === 0) return;

  let nextIndex = 0;
  const workerCount = Math.min(Math.max(1, limit), items.length);
  await Promise.all(
    Array.from({ length: workerCount }, async () => {
      while (nextIndex < items.length) {
        const current = nextIndex;
        nextIndex += 1;
        const item = items[current];
        if (item === undefined) return;
        await worker(item);
      }
    }),
  );
}

async function emitFileDiff(
  context: FileDiffContext,
  path: string,
  onEvent: (event: FileDiffStreamEvent) => Promise<void> | void,
): Promise<void> {
  try {
    const file = await loadFileDiffWithContext(context, path);
    await onEvent({ file });
  } catch (cause) {
    const error =
      cause instanceof Error
        ? cause.message
        : "No se pudo cargar el diff del archivo.";
    await onEvent({ path, error });
  }
}

export async function streamResolvedFileDiffs(
  context: FileDiffContext,
  paths: readonly string[],
  onEvent: (event: FileDiffStreamEvent) => Promise<void> | void,
  signal?: AbortSignal,
): Promise<void> {
  if (paths.length === 0) return;

  const emit = async (path: string) => {
    if (signal?.aborted) return;
    await emitFileDiff(context, path, onEvent);
  };

  const [priorityPath, ...rest] = paths;
  if (priorityPath) await emit(priorityPath);
  if (signal?.aborted) return;
  await runPool(rest, DIFF_CONCURRENCY, emit);
}

