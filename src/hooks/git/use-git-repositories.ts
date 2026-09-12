"use client";

import { useEffect, useState } from "react";

export function useGitRepositories(project: string | null | undefined) {
  const projectName = project?.trim() ?? "";
  const [names, setNames] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!projectName) {
      setNames([]);
      return;
    }

    const controller = new AbortController();
    setLoading(true);

    void fetch(
      `/api/ado/git/repositories?project=${encodeURIComponent(projectName)}`,
      { signal: controller.signal },
    )
      .then(async (res) => {
        const payload = (await res.json()) as { repositories?: string[] };
        if (controller.signal.aborted) return;
        setNames(Array.isArray(payload.repositories) ? payload.repositories : []);
        setLoading(false);
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setNames([]);
        setLoading(false);
      });

    return () => controller.abort();
  }, [projectName]);

  return { names, loading };
}
