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
const cache = new Map<string, CacheEntry>();

// Deduplicación de requests en vuelo: si llega una segunda llamada mientras la
// primera está pendiente, devuelve la misma promise.
let inFlight: Promise<AdoWorkItemTypeState[]> | null = null;
let inFlightKey: string | null = null;

function buildKey(): string {
  // Sin auth context en cliente — el endpoint ya filtra por organización/proyecto
  // del usuario autenticado. La key existe para invalidar el cache en `reload()`.
  return "default";
}

async function fetchBacklogStates(key: string): Promise<AdoWorkItemTypeState[]> {
  if (inFlight && inFlightKey === key) return inFlight;

  inFlightKey = key;
  inFlight = (async () => {
    try {
      const res = await fetch("/api/work-items/backlog-states", {
        cache: "no-store",
      });
      if (!res.ok) {
        // 401 u otros: modo degradado silencioso, devolvemos [].
        return [];
      }
      const data = (await res.json()) as { states?: AdoWorkItemTypeState[] };
      const states = Array.isArray(data.states) ? data.states : [];
      cache.set(key, { value: states, expiresAt: Date.now() + TTL_MS });
      return states;
    } catch {
      return [];
    } finally {
      inFlight = null;
      inFlightKey = null;
    }
  })();

  return inFlight;
}

export function useBacklogItemStates(): UseBacklogItemStatesResult {
  const key = buildKey();

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

    fetchBacklogStates(key)
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
  }, [key, reloadToken]);

  return { states, loading, error, reload };
}