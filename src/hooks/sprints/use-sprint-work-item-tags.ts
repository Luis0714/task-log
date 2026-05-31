"use client";

import { useEffect, useState } from "react";

import type { AdoWorkItemTagDto } from "@/lib/schemas/ado-catalog";
import { adoWorkItemTagsResponseSchema } from "@/lib/schemas/ado-catalog";

export type UseSprintWorkItemTagsResult = {
  tags: AdoWorkItemTagDto[];
  loading: boolean;
  error: string | null;
};

export function useSprintWorkItemTags(project: string): UseSprintWorkItemTagsResult {
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

    void (async () => {
      try {
        const res = await fetch(
          `/api/sprints/tags?project=${encodeURIComponent(trimmedProject)}`,
          { signal: controller.signal },
        );
        const payload: unknown = await res.json();

        if (!res.ok) {
          const message =
            typeof payload === "object" &&
            payload !== null &&
            "error" in payload &&
            typeof payload.error === "string"
              ? payload.error
              : "No se pudieron cargar los tags del proyecto.";
          throw new Error(message);
        }

        const parsed = adoWorkItemTagsResponseSchema.safeParse(payload);
        if (!parsed.success) {
          throw new Error("Respuesta de tags inválida.");
        }

        setTags(parsed.data.tags);
      } catch (cause) {
        if (controller.signal.aborted) return;
        const message =
          cause instanceof Error
            ? cause.message
            : "No se pudieron cargar los tags del proyecto.";
        setTags([]);
        setError(message);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    })();

    return () => controller.abort();
  }, [project]);

  return { tags, loading, error };
}
