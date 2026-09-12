"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { GitFileChange } from "@/lib/git/changeset";
import { fetchGitFileDiff } from "@/services/ado/git-compare.service";

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
};

export function useFileDiffCache(
  query: FileDiffCacheQuery,
  resetKey: string,
): UseFileDiffCacheResult {
  const { project, repository, source, target } = query;
  const [filesByPath, setFilesByPath] = useState<Record<string, GitFileChange>>({});
  const [errorsByPath, setErrorsByPath] = useState<Record<string, string>>({});
  const [pendingPaths, setPendingPaths] = useState<Record<string, true>>({});
  const filesRef = useRef(filesByPath);
  const inflightRef = useRef(new Map<string, AbortController>());
  filesRef.current = filesByPath;

  useEffect(() => {
    inflightRef.current.forEach((controller) => controller.abort());
    inflightRef.current.clear();
    setFilesByPath({});
    setErrorsByPath({});
    setPendingPaths({});
  }, [project, repository, resetKey, source, target]);

  const load = useCallback(
    (path: string) => {
      if (!path || filesRef.current[path] || inflightRef.current.has(path)) return;

      const controller = new AbortController();
      inflightRef.current.set(path, controller);
      setPendingPaths((current) => ({ ...current, [path]: true }));
      setErrorsByPath((current) => {
        if (!(path in current)) return current;
        const next = { ...current };
        delete next[path];
        return next;
      });

      void fetchGitFileDiff(
        { project, repository, source, target, path },
        controller.signal,
      ).then((result) => {
        inflightRef.current.delete(path);
        setPendingPaths((current) => {
          const next = { ...current };
          delete next[path];
          return next;
        });
        if (controller.signal.aborted) return;
        if (result.ok) {
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

  const isLoading = useCallback(
    (path: string) => Boolean(pendingPaths[path]),
    [pendingPaths],
  );

  return { filesByPath, errorsByPath, isLoading, load };
}
