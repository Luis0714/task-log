"use client";

import { useCallback, useEffect, useState } from "react";

import type { AdoTeamMemberDto } from "@/lib/schemas/ado-catalog";

export type UseTeamMembersParams = {
  project: string | null | undefined;
  team: string | null | undefined;
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
  status: "pending" | "ok" | "error";
  error: string | null;
};

const cache = new Map<string, CacheEntry>();

function buildUrl(project: string, team: string): string {
  const qs = new URLSearchParams({ project, team });
  return `/api/ado/team-members?${qs.toString()}`;
}

function cacheKey(project: string, team: string): string {
  return `${project}|${team}`;
}

function createEntry(project: string, team: string): CacheEntry {
  const entry: CacheEntry = {
    members: [],
    status: "pending",
    error: null,
    promise: fetch(buildUrl(project, team)).then(async (res) => {
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Error ${res.status}`);
      }
      const data = (await res.json()) as { members: AdoTeamMemberDto[] };
      return data.members ?? [];
    }),
  };
  return entry;
}

export function useTeamMembers({
  project,
  team,
  enabled = true,
}: UseTeamMembersParams): UseTeamMembersResult {
  const projectName = project?.trim() ?? "";
  const teamName = team?.trim() ?? "";
  const enabledEffective = enabled && Boolean(projectName) && Boolean(teamName);
  const key = cacheKey(projectName, teamName);

  const [members, setMembers] = useState<AdoTeamMemberDto[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    if (!enabledEffective) {
      setMembers([]);
      setError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    const cached = nonce === 0 ? cache.get(key) : undefined;

    if (cached?.status === "ok") {
      setMembers(cached.members);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const entry =
      cached && cached.status === "pending" ? cached : createEntry(projectName, teamName);
    cache.set(key, entry);

    void entry.promise
      .then((data) => {
        entry.members = data;
        entry.status = "ok";
        entry.error = null;
        if (cancelled) return;
        setMembers(data);
        setError(null);
        setLoading(false);
      })
      .catch((cause: unknown) => {
        cache.delete(key);
        if (cancelled) return;
        const message =
          cause instanceof Error
            ? cause.message
            : "No se pudieron cargar los miembros del equipo.";
        setMembers([]);
        setError(message);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [enabledEffective, key, nonce, projectName, teamName]);

  const refresh = useCallback(() => {
    cache.delete(key);
    setNonce((n) => n + 1);
  }, [key]);

  return { members, loading, error, refresh };
}
