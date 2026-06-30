"use client";

import { useCallback, useEffect, useState } from "react";

import type { AdoWorkItemTypeState } from "@/lib/azure-devops/work-item-type-states";

/**
 * Hook ÚNICO para los estados de Historias de Usuario (Backlog Item) en el cliente.
 *
 * Single source of truth: hace UNA sola request a
 * `GET /api/work-items/backlog-states` y cachea el resultado a nivel módulo
 * (compartido por TODOS los componentes que lo consuman). Si llega una segunda
 * llamada mientras la primera está en vuelo, se reutiliza la misma promise.
 *
 * Si el endpoint devuelve 401 (no autenticado) o falla, retorna `states: []` con
 * `error: null` — modo degradado silencioso. Los consumidores deben mostrar el
 * nombre del estado con un color neutro hasta que llegue la respuesta.
 *
 * El `project` es OBLIGATORIO para que el hook devuelva los estados del
 * proyecto activo. Si el proyecto cambia, el cache se invalida y se vuelve
 * a fethear (el server-side cache de Azure ya hace el resto).
 */
export type BacklogStates = readonly AdoWorkItemTypeState[];

export type UseBacklogItemStatesResult = {
  states: BacklogStates;
  loading: boolean;
  error: Error | null;
  reload: () => void;
};

const TTL_MS = 60 * 60 * 1000; // 1h, mismo TTL que el cache server-side.

type CacheEntry = { value: AdoWorkItemTypeState[]; expiresAt: number };

// Cache a nivel módulo: compartido por todas las instancias del hook en la app.
// La key incluye el project para que un cambio de proyecto invalide la caché.
const cache = new Map<string, CacheEntry>();

// Deduplicación de requests en vuelo: si llega una segunda llamada mientras la
// primera está pendiente, devuelve la misma promise.
const inFlight = new Map<string, Promise<AdoWorkItemTypeState[]>>();

function normalizeProject(project: string | null | undefined): string {
  return project?.trim() || "";
}

function buildCacheKey(project: string): string {
  return project || "__default__";
}

async function fetchBacklogStates(project: string): Promise<AdoWorkItemTypeState[]> {
  const inFlightKey = project || "__default__";
  const existing = inFlight.get(inFlightKey);
  if (existing) return existing;

  const promise = (async () => {
    try {
      const url = project
        ? `/api/work-items/backlog-states?project=${encodeURIComponent(project)}`
        : "/api/work-items/backlog-states";
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) {
        // 401 u otros: modo degradado silencioso, devolvemos [].
        return [];
      }
      const data = (await res.json()) as { states?: AdoWorkItemTypeState[] };
      const states = Array.isArray(data.states) ? data.states : [];
      cache.set(inFlightKey, { value: states, expiresAt: Date.now() + TTL_MS });
      return states;
    } catch {
      return [];
    } finally {
      inFlight.delete(inFlightKey);
    }
  })();

  inFlight.set(inFlightKey, promise);
  return promise;
}

/**
 * @param project Nombre del proyecto activo. Obligatorio para que el hook
 *                 devuelva los estados correctos al cambiar de proyecto.
 *                 Si se omite, se asume el proyecto por defecto del caller.
 */
export function useBacklogItemStates(project?: string | null): UseBacklogItemStatesResult {
  const normalizedProject = normalizeProject(project);
  const key = buildCacheKey(normalizedProject);

  // Sembramos el state con el cache sincrónico si está vigente — evita el
  // flash inicial de "loading" en navegaciones subsecuentes dentro de la app.
  const [states, setStates] = useState<AdoWorkItemTypeState[]>(() => {
    const entry = cache.get(key);
    if (entry && entry.expiresAt > Date.now()) return entry.value;
    return [];
  });
  const [loading, setLoading] = useState<boolean>(() => {
    const entry = cache.get(key);
    return !(entry && entry.expiresAt > Date.now());
  });
  const [error, setError] = useState<Error | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const reload = useCallback(() => {
    cache.delete(key);
    setReloadToken((token) => token + 1);
  }, [key]);

  useEffect(() => {
    // Si hay cache vigente, no refetchamos ni marcamos loading.
    const cached = cache.get(key);
    if (cached && cached.expiresAt > Date.now()) {
      setStates(cached.value);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setError(null);

    fetchBacklogStates(normalizedProject)
      .then((result) => {
        if (controller.signal.aborted) return;
        setStates(result);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err : new Error(String(err)));
        setStates([]);
        setLoading(false);
      });

    return () => {
      controller.abort();
    };
  }, [key, normalizedProject, reloadToken]);

  return { states, loading, error, reload };
}