"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  RELEASE_APPROVE_SUCCESS,
  RELEASE_APPROVE_SUCCESS_DESCRIPTION,
} from "@/lib/releases/copy";
import type { ReleaseFilterOptions } from "@/lib/releases/filter-form-model";
import {
  EMPTY_RELEASE_FILTERS,
  isReleaseFilterActive,
  matchesReleaseFilters,
  releaseActiveFilterCount,
  releaseBranchOptions,
  releaseCreatedByOptions,
  releaseEnvironmentOptions,
  type ReleaseFilters,
} from "@/lib/releases/filters";
import { matchesReleaseSearch } from "@/lib/releases/summary";
import type {
  ReleaseDefinitionOption,
  ReleaseListItem,
  ReleaseTab,
} from "@/lib/releases/types";
import { appToast } from "@/lib/toast";
import {
  approveReleaseRequest,
  fetchReleaseList,
} from "@/services/ado/releases.service";

export type UseReleaseListParams = {
  project: string | null;
};

type Snapshot = {
  key: string;
  definitions: ReleaseDefinitionOption[];
  items: ReleaseListItem[];
  pendingCount: number;
  error: string | null;
};

export function useReleaseList({ project }: UseReleaseListParams) {
  const projectName = project?.trim() ?? "";
  const [definitionId, setDefinitionId] = useState<number | null>(null);
  const [tab, setTab] = useState<ReleaseTab>("all");
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<ReleaseFilters>(EMPTY_RELEASE_FILTERS);
  const [pending, setPending] = useState(false);
  const requestKey = `${projectName}|${definitionId ?? "auto"}`;
  const [snapshot, setSnapshot] = useState<Snapshot>({
    key: "",
    definitions: [],
    items: [],
    pendingCount: 0,
    error: null,
  });

  const reload = useCallback(
    (signal?: AbortSignal) => {
      if (!projectName) return;
      void fetchReleaseList(projectName, definitionId ?? undefined, signal).then(
        (result) => {
          if (signal?.aborted) return;
          if (!result.ok) {
            setSnapshot({
              key: requestKey,
              definitions: [],
              items: [],
              pendingCount: 0,
              error: result.error,
            });
            return;
          }

          const resolvedId = definitionId ?? result.definitionId;
          setSnapshot({
            key: `${projectName}|${resolvedId ?? "auto"}`,
            definitions: result.definitions,
            items: result.items,
            pendingCount: result.pendingCount,
            error: null,
          });
          if (definitionId == null && resolvedId != null) {
            setDefinitionId(resolvedId);
          }
        },
      );
    },
    [definitionId, projectName, requestKey],
  );

  useEffect(() => {
    if (!projectName) return;
    const controller = new AbortController();
    reload(controller.signal);
    return () => controller.abort();
  }, [projectName, reload]);

  const approve = useCallback(
    async (approvalId: number, environment: string) => {
      if (!projectName || pending) return false;
      setPending(true);
      try {
        const result = await approveReleaseRequest(projectName, approvalId);
        if (!result.ok) {
          appToast.error(result.error);
          return false;
        }
        appToast.success(RELEASE_APPROVE_SUCCESS(environment), {
          description: RELEASE_APPROVE_SUCCESS_DESCRIPTION,
        });
        reload();
        return true;
      } catch (cause) {
        appToast.fromError(cause, "No se pudo aprobar el despliegue.");
        return false;
      } finally {
        setPending(false);
      }
    },
    [pending, projectName, reload],
  );

  const loading = Boolean(projectName) && snapshot.key !== requestKey;
  const filterOptions = useMemo<ReleaseFilterOptions>(
    () => ({
      createdBy: releaseCreatedByOptions(snapshot.items),
      branches: releaseBranchOptions(snapshot.items),
      environments: releaseEnvironmentOptions(snapshot.items),
    }),
    [snapshot.items],
  );
  const filtered = useMemo(() => {
    const searched = snapshot.items.filter(
      (item) =>
        matchesReleaseSearch(item, search) && matchesReleaseFilters(item, filters),
    );
    if (tab === "pending") {
      return searched.filter((item) => item.pendingCount > 0);
    }
    return searched;
  }, [filters, search, snapshot.items, tab]);

  return {
    tab,
    search,
    filters,
    filterOptions,
    definitionId,
    definitions: snapshot.definitions,
    items: filtered,
    pendingCount: snapshot.pendingCount,
    totalCount: snapshot.items.length,
    hasActiveFilters:
      Boolean(search.trim()) || tab === "pending" || isReleaseFilterActive(filters),
    activeFilterCount: releaseActiveFilterCount(filters),
    loading,
    pending,
    error: loading ? null : snapshot.error,
    setTab,
    setSearch,
    setFilters,
    setDefinitionId,
    approve,
  };
}
