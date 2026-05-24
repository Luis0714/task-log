"use client";

import { useEffect, useState } from "react";

import type { AdoWorkItemOptionDto } from "@/lib/schemas/ado-catalog";

type UseAdoSprintWorkItemsResult = {
  workItems: AdoWorkItemOptionDto[];
  loading: boolean;
  error: string | null;
};

export function useAdoSprintWorkItems(
  sprintPath: string | undefined,
  enabled = true,
): UseAdoSprintWorkItemsResult {
  const [workItems, setWorkItems] = useState<AdoWorkItemOptionDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !sprintPath) {
      setWorkItems([]);
      setError(null);
      setLoading(false);
      return;
    }

    const iterationPath = sprintPath;
    const controller = new AbortController();

    async function loadWorkItems() {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({ sprintPath: iterationPath });
        const res = await fetch(`/api/ado/work-items?${params.toString()}`, {
          signal: controller.signal,
        });
        const data = (await res.json()) as {
          workItems?: AdoWorkItemOptionDto[];
          error?: string;
          detail?: string;
        };

        if (!res.ok) {
          setWorkItems([]);
          setError(
            [data.error, data.detail].filter(Boolean).join(" — ") ||
              "Error al cargar work items.",
          );
          return;
        }

        setWorkItems(data.workItems ?? []);
      } catch (cause) {
        if (cause instanceof DOMException && cause.name === "AbortError") return;
        setWorkItems([]);
        setError("No se pudieron cargar los work items.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void loadWorkItems();
    return () => controller.abort();
  }, [enabled, sprintPath]);

  return { workItems, loading, error };
}
