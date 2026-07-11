"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import type {
  NewsStoriesValidationResponse,
  NewsStoryValidationEntry,
} from "@/lib/news-stories/types";
import {
  linkNewsStory as linkNewsStoryRequest,
  listNewsStories,
  searchAdoUserStories,
  unlinkNewsStory as unlinkNewsStoryRequest,
  validateNewsStories,
  type AdoUserStoryHit,
  type NewsStoriesServiceResult,
} from "@/services/news-stories/news-stories.service";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import type { ProjectTeamNewsStory } from "@/lib/db";
import { appToast } from "@/lib/toast";

const SEARCH_DEBOUNCE_MS = 350;

export type NewsStoriesScope = Readonly<{
  projectId: string;
  teamId: string;
}>;

export type UseNewsStoriesResult = Readonly<{
  linked: ReadonlyArray<ProjectTeamNewsStory>;
  linkedLoading: boolean;
  validation: ReadonlyMap<string, NewsStoryValidationEntry>;
  validationLoading: boolean;
  validationError: string | null;
  refreshLinked: () => Promise<void>;
  refreshValidation: () => Promise<void>;

  searchInput: string;
  setSearchInput: (value: string) => void;
  searchResults: ReadonlyArray<AdoUserStoryHit>;
  searching: boolean;
  searchError: string | null;
  retrySearch: () => void;
  /** Token para identificar la última query ejecutada (útil para debounce/cancel). */
  searchNonce: number;

  link: (hit: AdoUserStoryHit) => Promise<NewsStoriesServiceResult<ProjectTeamNewsStory>>;
  unlink: (id: string) => Promise<NewsStoriesServiceResult<{ ok: true }>>;
}>;

function mapValidationEntries(
  entries: ReadonlyArray<NewsStoryValidationEntry>,
): ReadonlyMap<string, NewsStoryValidationEntry> {
  const map = new Map<string, NewsStoryValidationEntry>();
  for (const entry of entries) {
    map.set(entry.id, entry);
  }
  return map;
}

/**
 * Orquesta el estado del módulo de HUs de novedad para un (proyecto, equipo):
 * - Lista las HUs vinculadas y su estado actual en Azure.
 * - Busca nuevas HUs en el backlog con debounce.
 * - Vincula / desvincula con feedback al usuario.
 *
 * La responsabilidad de presentación vive en componentes; este hook sólo
 * coordina fetching + estado.
 */
export function useNewsStories(scope: NewsStoriesScope): UseNewsStoriesResult {
  const [linked, setLinked] = useState<ReadonlyArray<ProjectTeamNewsStory>>([]);
  const [linkedLoading, setLinkedLoading] = useState(false);

  const [validation, setValidation] = useState<
    ReadonlyMap<string, NewsStoryValidationEntry>
  >(new Map());
  const [validationLoading, setValidationLoading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState("");
  const [searchResults, setSearchResults] = useState<ReadonlyArray<AdoUserStoryHit>>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchNonce, setSearchNonce] = useState(0);

  const debouncedQuery = useDebouncedValue(searchInput, SEARCH_DEBOUNCE_MS);
  const trimmedQuery = debouncedQuery.trim();
  const queryIsNumeric = /^\d+$/.test(trimmedQuery);
  const queryIsLongEnough = trimmedQuery.length >= 3;
  const canSearch = trimmedQuery.length > 0 && (queryIsNumeric || queryIsLongEnough);

  const refreshLinked = useCallback(async () => {
    if (!scope.projectId) {
      setLinked([]);
      return;
    }
    setLinkedLoading(true);
    const result = await listNewsStories({
      projectId: scope.projectId,
      teamId: scope.teamId || null,
    });
    setLinkedLoading(false);
    if (!result.ok) {
      appToast.error(result.message);
      setLinked([]);
      return;
    }
    setLinked(result.value);
  }, [scope.projectId, scope.teamId]);

  const refreshValidation = useCallback(async () => {
    if (!scope.projectId) {
      setValidation(new Map());
      setValidationError(null);
      return;
    }
    setValidationLoading(true);
    setValidationError(null);
    const result = await validateNewsStories({
      projectId: scope.projectId,
      teamId: scope.teamId || null,
    });
    setValidationLoading(false);
    if (!result.ok) {
      setValidationError(result.message);
      setValidation(new Map());
      return;
    }
    setValidation(mapValidationEntries(result.value));
  }, [scope.projectId, scope.teamId]);

  useEffect(() => {
    void refreshLinked();
  }, [refreshLinked]);

  useEffect(() => {
    void refreshValidation();
  }, [refreshValidation]);

  const linkedIds = useMemo(
    () => new Set(linked.map((row) => row.workItemId)),
    [linked],
  );

  useEffect(() => {
    if (!scope.projectId || !canSearch) {
      setSearchResults([]);
      setSearchError(null);
      setSearching(false);
      return;
    }

    const controller = new AbortController();
    setSearching(true);
    setSearchError(null);

    void (async () => {
      const result = await searchAdoUserStories(
        {
          project: scope.projectId,
          team: scope.teamId || null,
          q: trimmedQuery,
        },
        controller.signal,
      );
      if (controller.signal.aborted) return;
      setSearching(false);
      if (!result.ok) {
        setSearchError(result.message);
        setSearchResults([]);
        return;
      }
      setSearchResults(result.value.filter((hit) => !linkedIds.has(hit.id)));
      setSearchNonce((n) => n + 1);
    })();

    return () => controller.abort();
  }, [scope.projectId, scope.teamId, trimmedQuery, canSearch, linkedIds]);

  const retrySearch = useCallback(() => {
    setSearchError(null);
    setSearchInput((current) => current);
  }, []);

  const link = useCallback(
    async (hit: AdoUserStoryHit) => {
      const result = await linkNewsStoryRequest({
        projectId: scope.projectId,
        teamId: scope.teamId || null,
        workItemId: hit.id,
        workItemTitle: hit.title,
      });
      if (!result.ok) return result;
      await refreshLinked();
      return result;
    },
    [scope.projectId, scope.teamId, refreshLinked],
  );

  const unlink = useCallback(async (id: string) => {
    const result = await unlinkNewsStoryRequest(id);
    if (!result.ok) return result;
    await refreshLinked();
    return result;
  }, [refreshLinked]);

  return {
    linked,
    linkedLoading,
    validation,
    validationLoading,
    validationError,
    refreshLinked,
    refreshValidation,
    searchInput,
    setSearchInput,
    searchResults,
    searching,
    searchError,
    retrySearch,
    searchNonce,
    link,
    unlink,
  };
}

export type { NewsStoriesValidationResponse };