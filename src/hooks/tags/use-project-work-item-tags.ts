"use client";

import { useEffect, useState } from "react";

import type { AdoWorkItemTagDto } from "@/lib/schemas/ado-catalog";
import { fetchProjectWorkItemTags } from "@/services/tags/project-work-item-tags.service";

export type UseProjectWorkItemTagsResult = {
  tags: AdoWorkItemTagDto[];
  loading: boolean;
  error: string | null;
};

export function useProjectWorkItemTags(project: string): UseProjectWorkItemTagsResult {
  const [tags, setTags] = useState<AdoWorkItemTagDto[]>([]);
  const [loading, setLoading] = useState(Boolean(project.trim()));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const trimmedProject = project.trim();
    if (!trimmedProject) {
      setTags([]);
      setLoading(false);
      setError(null);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setError(null);

    void fetchProjectWorkItemTags(trimmedProject, controller.signal).then((result) => {
      if (controller.signal.aborted) return;

      if (result.ok) {
        setTags(result.tags);
        setError(null);
      } else {
        setTags([]);
        setError(result.error);
      }

      setLoading(false);
    });

    return () => controller.abort();
  }, [project]);

  return { tags, loading, error };
}
