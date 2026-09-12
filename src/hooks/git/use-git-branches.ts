"use client";

import { useEffect, useState } from "react";

import type { GitBranchOption } from "@/lib/git/branch-option";

export function useGitBranches(
  project: string | null | undefined,
  repository: string,
) {
  const projectName = project?.trim() ?? "";
  const repoName = repository.trim();
  const [options, setOptions] = useState<GitBranchOption[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!projectName || !repoName) {
      setOptions([]);
      return;
    }

    const controller = new AbortController();
    setLoading(true);

    const query = new URLSearchParams({ project: projectName, repository: repoName });
    void fetch(`/api/ado/git/branches?${query}`, { signal: controller.signal })
      .then(async (res) => {
        const payload = (await res.json()) as { branches?: string[] };
        if (controller.signal.aborted) return;
        setOptions(
          (payload.branches ?? []).map((name) => ({
            name,
            isDefault: name === "main" || name === "master" || name === "develop",
          })),
        );
        setLoading(false);
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setOptions([]);
        setLoading(false);
      });

    return () => controller.abort();
  }, [projectName, repoName]);

  return { options, loading };
}
