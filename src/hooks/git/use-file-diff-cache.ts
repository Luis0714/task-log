"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { GitFileChange } from "@/lib/git/changeset";
import { resolveFileDiffPaths } from "@/lib/git/is-git-file-path";
import {
  fetchGitFileDiff,
  streamGitFileDiffs,
} from "@/services/ado/git-compare.service";

export type FileDiffCacheQuery = {
  project: string;
  repository: string;
  source: string;
  target: string;
};

export type UseFileDiffCacheResult = {
  filesByPath: Readonly<Record<string, GitFileChange>>;
  errorsByPath: Readonly<Record<string, string>>;
  isLoading: (path: string) => boolean;
  load: (path: string) => void;
  prefetchAll: (paths: readonly string[], priorityPath?: string | null) => void;
};

function omitKey<T>(current: Record<string, T>, key: string): Record<string, T> {
  if (!(key in current)) return current;
  const next = { ...current };
  delete next[key];
  return next;
}

export function useFileDiffCache(
  query: FileDiffCacheQuery,
  resetKey: string,
): UseFileDiffCacheResult {
  const { project, repository, source, target } = query;
  const [filesByPath, setFilesByPath] = useState<Record<string, GitFileChange>>({});
  const [errorsByPath, setErrorsByPath] = useState<Record<string, string>>({});
  const filesRef = useRef(filesByPath);
  const inflightRef = useRef(new Map<string, AbortController>());
  const prefetchingRef = useRef(false);
  const generationRef = useRef(0);
  filesRef.current = filesByPath;

  useEffect(() => {
    generationRef.current += 1;
    prefetchingRef.current = false;
    inflightRef.current.forEach((controller) => controller.abort());
    inflightRef.current.clear();
    filesRef.current = {};
    setFilesByPath({});
    setErrorsByPath({});

    return () => {
      inflightRef.current.forEach((controller) => controller.abort());
      inflightRef.current.clear();
    };
  }, [project, repository, resetKey, source, target]);

  const load = useCallback(
    (path: string) => {
      if (!path || filesRef.current[path] || inflightRef.current.has(path)) return;

      const controller = new AbortController();
      inflightRef.current.set(path, controller);
      setErrorsByPath((current) => omitKey(current, path));

      void fetchGitFileDiff(
        { project, repository, source, target, path },
        controller.signal,
      ).then((result) => {
        inflightRef.current.delete(path);
        if (controller.signal.aborted) return;
        if (result.ok) {
          filesRef.current = { ...filesRef.current, [result.file.path]: result.file };
          setFilesByPath((current) => ({
            ...current,
            [result.file.path]: result.file,
          }));
          return;
        }
        if (result.error === "Cancelado") return;
        setErrorsByPath((current) => ({ ...current, [path]: result.error }));
      });
    },
    [project, repository, source, target],
  );

  const prefetchAll = useCallback(
    (paths: readonly string[], priorityPath?: string | null) => {
      if (prefetchingRef.current) return;

      const toFetch = resolveFileDiffPaths(paths, priorityPath).filter(
        (path) => !filesRef.current[path] && !inflightRef.current.has(path),
      );
      if (toFetch.length === 0) return;

      const generation = generationRef.current;
      const controller = new AbortController();
      prefetchingRef.current = true;
      for (const path of toFetch) {
        inflightRef.current.set(path, controller);
      }
      setErrorsByPath((current) => {
        const next = { ...current };
        for (const path of toFetch) delete next[path];
        return next;
      });

      void streamGitFileDiffs(
        { project, repository, source, target, paths: toFetch, priorityPath },
        {
          onFile: (file) => {
            if (generation !== generationRef.current) return;
            inflightRef.current.delete(file.path);
            filesRef.current = { ...filesRef.current, [file.path]: file };
            setFilesByPath((current) => ({ ...current, [file.path]: file }));
            setErrorsByPath((current) => omitKey(current, file.path));
          },
          onError: (path, error) => {
            if (generation !== generationRef.current) return;
            inflightRef.current.delete(path);
            setErrorsByPath((current) => ({ ...current, [path]: error }));
          },
        },
        controller.signal,
      ).then((result) => {
        if (generation !== generationRef.current) return;
        prefetchingRef.current = false;
        for (const path of toFetch) {
          inflightRef.current.delete(path);
        }
        if (result.ok || result.error === "Cancelado") return;

        const fallback =
          (priorityPath && !filesRef.current[priorityPath] ? priorityPath : null) ??
          toFetch.find((path) => !filesRef.current[path]);
        if (fallback) load(fallback);
      });
    },
    [load, project, repository, source, target],
  );

  const isLoading = useCallback(
    (path: string) => Boolean(path) && !(path in filesByPath) && !(path in errorsByPath),
    [errorsByPath, filesByPath],
  );

  return { filesByPath, errorsByPath, isLoading, load, prefetchAll };
}
