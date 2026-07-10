"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { AdoTeamMemberDto } from "@/lib/schemas/ado-catalog";

export type UseTeamMembersParams = {
  project: string | null | undefined;
  team: string | null | undefined;
  /**
   * Permite desactivar la consulta (p. ej. hasta que el usuario esté
   * autenticado contra Azure DevOps). Default: `true`.
   */
  enabled?: boolean;
};

export type UseTeamMembersResult = {
  members: AdoTeamMemberDto[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
};

type CacheEntry = {
  promise: Promise<AdoTeamMemberDto[]>;
  members: AdoTeamMemberDto[];
  status: "ok" | "error";
  error: string | null;
};

const cache = new Map<string, CacheEntry>();

function buildUrl(params: UseTeamMembersParams): string {
  const qs = new URLSearchParams();
  if (params.project) qs.set("project", params.project);
  if (params.team) qs.set("team", params.team);
  const query = qs.toString();
  const suffix = query ? `?${query}` : "";
  return `/api/ado/team-members${suffix}`;
}

function cacheKey(params: UseTeamMembersParams): string {
  return `${params.project ?? ""}|${params.team ?? ""}`;
}

function createEntry(
  params: UseTeamMembersParams,
  signal: AbortSignal,
): CacheEntry {
  return {
    members: [],
    status: "ok",
    error: null,
    promise: fetch(buildUrl(params), { signal })
      .then(async (res) => {
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || `Error ${res.status}`);
        }
        const data = (await res.json()) as { members: AdoTeamMemberDto[] };
        return data.members ?? [];
      })
      .catch((cause) => {
        if (cause instanceof DOMException && cause.name === "AbortError") {
          return [];
        }
        throw cause;
      }),
  };
}

function fetchEntry(
  key: string,
  params: UseTeamMembersParams,
  signal: AbortSignal,
): CacheEntry {
  const existing = cache.get(key);
  if (existing) return existing;
  const entry = createEntry(params, signal);
  cache.set(key, entry);
  return entry;
}

/**
 * Hook unificado para obtener el roster del equipo visible en la app.
 * Cachea en memoria por `(project, team)` durante la sesión para no
 * refetchar al navegar entre pantallas.
 */
export function useTeamMembers(params: UseTeamMembersParams): UseTeamMembersResult {
  const { project, team, enabled = true } = params;
  const enabledEffective = enabled && Boolean(project) && Boolean(team);

  const [members, setMembers] = useState<AdoTeamMemberDto[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [nonce, setNonce] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  const key = useMemo(
    () => cacheKey({ project, team }),
    [project, team],
  );

  const cached = cache.get(key);
  const shouldFetch = enabledEffective && (nonce > 0 || !cached);

  useEffect(() => {
    if (!shouldFetch) {
      abortRef.current?.abort();
      abortRef.current = null;
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const entry = nonce > 0
      ? fetchEntry(key, params, controller.signal)
      : cached ?? createEntry(params, controller.signal);

    if (nonce > 0) cache.set(key, entry);

    void entry.promise
      .then((data) => {
        if (controller.signal.aborted) return;
        entry.members = data;
        entry.status = "ok";
        entry.error = null;
        setMembers(data);
        setError(null);
        setLoading(false);
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;
        cache.delete(key);
        entry.status = "error";
        entry.error =
          cause instanceof Error
            ? cause.message
            : "No se pudieron cargar los miembros del equipo.";
        setMembers([]);
        setError(entry.error);
        setLoading(false);
      });

    return () => {
      controller.abort();
    };
  }, [shouldFetch, key, nonce, project, team, params, cached]);

  // Sincronizamos el estado con la caché durante el render (patrón
  // "storing info from previous renders" — ver docs de React). Evita
  // setState dentro del useEffect para mantener limpio el lint.
  if (!enabledEffective) {
    resetToEmpty();
  } else if (shouldFetch) {
    setLoadingState();
  } else if (cached) {
    syncWithCache(cached);
  }

  const refresh = useCallback(() => {
    cache.delete(key);
    setNonce((n) => n + 1);
  }, [key]);

  function resetToEmpty() {
    if (members.length > 0 || error !== null || loading) {
      setMembers([]);
      setError(null);
      setLoading(false);
    }
  }

  function setLoadingState() {
    if (!loading) setLoading(true);
    if (error !== null) setError(null);
  }

  function syncWithCache(entry: CacheEntry) {
    if (entry.status === "error") {
      if (error !== entry.error || members.length > 0 || loading) {
        setMembers([]);
        setError(entry.error);
        setLoading(false);
      }
      return;
    }
    if (
      members !== entry.members ||
      (error !== null && entry.members.length > 0) ||
      loading
    ) {
      setMembers(entry.members);
      setError(null);
      setLoading(false);
    }
  }

  return { members, loading, error, refresh };
}