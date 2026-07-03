"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { AdoTeamMemberDto } from "@/lib/schemas/ado-catalog";

export type UseTeamMembersSource = "workItems" | "tasks" | "bugs";

export type UseTeamMembersParams = {
  project: string | null | undefined;
  team: string | null | undefined;
  sprintPath?: string | null | undefined;
  source?: UseTeamMembersSource;
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
  if (params.sprintPath) qs.set("sprintPath", params.sprintPath);
  if (params.source) qs.set("source", params.source);
  return `/api/ado/team-members${qs.toString() ? `?${qs}` : ""}`;
}

function cacheKey(params: UseTeamMembersParams): string {
  return `${params.project ?? ""}|${params.team ?? ""}|${params.sprintPath ?? ""}|${params.source ?? ""}`;
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
 * Hook unificado para obtener los miembros del equipo visibles en la app:
 * roster oficial + asignados del sprint. Cachea en memoria por params
 * durante la sesión para no refetchar al navegar entre pantallas.
 */
export function useTeamMembers(params: UseTeamMembersParams): UseTeamMembersResult {
  const { project, team, sprintPath, source, enabled = true } = params;
  const enabledEffective = enabled && Boolean(project) && Boolean(team);

  const [members, setMembers] = useState<AdoTeamMemberDto[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [nonce, setNonce] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  const key = useMemo(
    () => cacheKey({ project, team, sprintPath, source }),
    [project, team, sprintPath, source],
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
  }, [shouldFetch, key, nonce, project, team, sprintPath, source, params, cached]);

  // Sincronizamos el estado con la caché durante el render (patrón
  // "storing info from previous renders" — ver docs de React). Evita
  // setState dentro del useEffect para mantener limpio el lint.
  if (!enabledEffective) {
    if (members.length > 0 || error !== null || loading) {
      setMembers([]);
      setError(null);
      setLoading(false);
    }
  } else if (shouldFetch) {
    if (!loading) setLoading(true);
    if (error !== null) setError(null);
  } else if (cached) {
    if (cached.status === "error") {
      if (error !== cached.error || members.length > 0 || loading) {
        setMembers([]);
        setError(cached.error);
        setLoading(false);
      }
    } else if (
      members !== cached.members ||
      (error !== null && cached.members.length > 0) ||
      loading
    ) {
      setMembers(cached.members);
      setError(null);
      setLoading(false);
    }
  }

  const refresh = useCallback(() => {
    cache.delete(key);
    setNonce((n) => n + 1);
  }, [key]);

  return { members, loading, error, refresh };
}