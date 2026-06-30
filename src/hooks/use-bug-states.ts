"use client";

import { useEffect, useState } from "react";

import type { AdoWorkItemTypeState } from "@/lib/azure-devops/work-item-type-states";

/**
 * Estados de Bugs del proyecto activo.
 *
 * Acepta `project` para que el endpoint devuelva los estados del proyecto
 * seleccionado, no del proyecto por defecto del caller. Si el proyecto
 * cambia, el hook refetchea automáticamente.
 *
 * Cache módulo-level (TTL 5 min) + dedup de requests en vuelo: si dos
 * componentes piden los mismos estados, comparten UNA sola fetch.
 */
export function useBugStates(project?: string | null): {
  states: readonly AdoWorkItemTypeState[];
  loading: boolean;
} {
  const [states, setStates] = useState<readonly AdoWorkItemTypeState[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    fetchBugStates(project)
      .then((result) => {
        if (cancelled) return;
        setStates(result);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [project]);

  return { states, loading };
}

const TTL_MS = 5 * 60 * 1000;
const cache = new Map<string, { value: AdoWorkItemTypeState[]; expiresAt: number }>();
const inFlight = new Map<string, Promise<AdoWorkItemTypeState[]>>();

function keyOf(project: string | null | undefined): string {
  return project?.trim() || "__default__";
}

async function fetchBugStates(
  project: string | null | undefined,
): Promise<AdoWorkItemTypeState[]> {
  const key = keyOf(project);

  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  const pending = inFlight.get(key);
  if (pending !== undefined) return pending;

  const url = project
    ? `/api/ado/bug-states?project=${encodeURIComponent(project)}`
    : "/api/ado/bug-states";

  const promise = (async () => {
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) return [];
      const data = (await res.json()) as { states?: AdoWorkItemTypeState[] };
      const states = Array.isArray(data.states) ? data.states : [];
      cache.set(key, { value: states, expiresAt: Date.now() + TTL_MS });
      return states;
    } catch {
      return [];
    } finally {
      inFlight.delete(key);
    }
  })();

  inFlight.set(key, promise);
  return promise;
}