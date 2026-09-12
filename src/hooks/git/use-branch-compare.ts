"use client";

import { useEffect, useState } from "react";

import type { GitChangeset } from "@/lib/git/changeset";
import { fetchGitCompare } from "@/services/ado/git-compare.service";

export type UseBranchCompareInput = {
  project: string | null | undefined;
  repository: string;
  source: string;
  target: string;
};

export type UseBranchCompareResult = {
  changeset: GitChangeset | null;
  loading: boolean;
  error: string | null;
};

type CompareSnapshot = {
  key: string;
  changeset: GitChangeset | null;
  error: string | null;
};

export function useBranchCompare({
  project,
  repository,
  source,
  target,
}: UseBranchCompareInput): UseBranchCompareResult {
  const projectName = project?.trim() ?? "";
  const repoName = repository.trim();
  const sourceBranch = source.trim();
  const targetBranch = target.trim();
  const enabled = Boolean(
    projectName && repoName && sourceBranch && targetBranch && sourceBranch !== targetBranch,
  );
  const requestKey = `${projectName}|${repoName}|${sourceBranch}|${targetBranch}`;

  const [snapshot, setSnapshot] = useState<CompareSnapshot>({
    key: "",
    changeset: null,
    error: null,
  });

  useEffect(() => {
    if (!enabled) return;

    const controller = new AbortController();

    void fetchGitCompare(
      {
        project: projectName,
        repository: repoName,
        source: sourceBranch,
        target: targetBranch,
      },
      controller.signal,
    ).then((result) => {
      if (controller.signal.aborted) return;
      if (result.ok) {
        setSnapshot({ key: requestKey, changeset: result.changeset, error: null });
        return;
      }
      setSnapshot({ key: requestKey, changeset: null, error: result.error });
    });

    return () => controller.abort();
  }, [enabled, projectName, repoName, requestKey, sourceBranch, targetBranch]);

  if (!enabled) {
    return { changeset: null, loading: false, error: null };
  }

  const loading = snapshot.key !== requestKey;
  return {
    changeset: loading ? null : snapshot.changeset,
    loading,
    error: loading ? null : snapshot.error,
  };
}
