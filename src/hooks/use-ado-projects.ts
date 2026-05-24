"use client";

import { useEffect, useState } from "react";

import type { AdoProjectDto } from "@/lib/schemas/ado-catalog";

type UseAdoProjectsResult = {
  projects: AdoProjectDto[];
  defaultProject: string | null;
  loading: boolean;
  error: string | null;
};

export function useAdoProjects(enabled = true): UseAdoProjectsResult {
  const [projects, setProjects] = useState<AdoProjectDto[]>([]);
  const [defaultProject, setDefaultProject] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      setProjects([]);
      setDefaultProject(null);
      setError(null);
      return;
    }

    const controller = new AbortController();

    async function loadProjects() {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/ado/projects", { signal: controller.signal });
        const data = (await res.json()) as {
          projects?: AdoProjectDto[];
          defaultProject?: string;
          error?: string;
          detail?: string;
        };

        if (!res.ok) {
          setProjects([]);
          setDefaultProject(null);
          setError(
            [data.error, data.detail].filter(Boolean).join(" — ") ||
              "Error al cargar proyectos.",
          );
          return;
        }

        setProjects(data.projects ?? []);
        setDefaultProject(data.defaultProject?.trim() || null);
      } catch (cause) {
        if (cause instanceof DOMException && cause.name === "AbortError") return;
        setProjects([]);
        setDefaultProject(null);
        setError("No se pudieron cargar los proyectos.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void loadProjects();
    return () => controller.abort();
  }, [enabled]);

  return { projects, defaultProject, loading, error };
}
