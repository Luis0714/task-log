"use client";

import { useEffect, useState } from "react";

import type { GitFileChange } from "@/lib/git/changeset";
import { fetchGitFileDiff } from "@/services/ado/git-compare.service";

export type UseFileDiffInput = {
  project: string;
  repository: string;
  source: string;
  target: string;
  path: string | null;
};

export type UseFileDiffResult = {
  file: GitFileChange | null;
  loading: boolean;
  error: string | null;
};

export function useFileDiff({
  project,
  repository,
  source,
  target,
  path,
}: UseFileDiffInput): UseFileDiffResult {
  const enabled = Boolean(project && repository && source && target && path);
  const requestKey = `${project}|${repository}|${source}|${target}|${path ?? ""}`;
  const [file, setFile] = useState<GitFileChange | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadedKey, setLoadedKey] = useState("");

  useEffect(() => {
    if (!enabled || !path) return;

    const controller = new AbortController();
    setError(null);

    void fetchGitFileDiff(
      { project, repository, source, target, path },
      controller.signal,
    ).then((result) => {
      if (controller.signal.aborted) return;
      if (result.ok) {
        setFile(result.file);
        setLoadedKey(requestKey);
        setError(null);
        return;
      }
      if (result.error === "Cancelado") return;
      setFile(null);
      setLoadedKey(requestKey);
      setError(result.error);
    });

    return () => controller.abort();
  }, [enabled, path, project, repository, requestKey, source, target]);

  if (!enabled) {
    return { file: null, loading: false, error: null };
  }

  const loading = loadedKey !== requestKey;
  return {
    file: loading ? null : file,
    loading,
    error: loading ? null : error,
  };
}
