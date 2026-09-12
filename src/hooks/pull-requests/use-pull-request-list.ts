"use client";

import { useEffect, useMemo, useState } from "react";

import { useGitRepositories } from "@/hooks/git/use-git-repositories";
import { useTeamMembers } from "@/hooks/use-team-members";
import { filterPullRequests } from "@/lib/pull-requests/filter-pull-requests";
import { hasActivePullRequestFilters } from "@/lib/pull-requests/filter-helpers";
import {
  ALL_REPOSITORIES_VALUE,
  ANY_FILTER_VALUE,
  type PullRequestFilterState,
  type PullRequestLifecycleStatus,
  type PullRequestListItem,
  type PullRequestTab,
} from "@/lib/pull-requests/types";
import { fetchPullRequestList } from "@/services/ado/git-pull-request.service";

function initialFilters(defaultRepository: string | null): PullRequestFilterState {
  return {
    search: "",
    tab: "active",
    repository: defaultRepository || ALL_REPOSITORIES_VALUE,
    createdBy: ANY_FILTER_VALUE,
    assignedTo: ANY_FILTER_VALUE,
  };
}

export type UsePullRequestListParams = {
  project: string | null;
  team: string | null;
  defaultRepository: string | null;
};

type ListSnapshot = {
  key: string;
  items: PullRequestListItem[];
  activeCount: number;
  error: string | null;
};

function tabToStatus(tab: PullRequestTab): PullRequestLifecycleStatus {
  return tab === "mine" ? "active" : tab;
}

function scopedRepository(repository: string): string | undefined {
  const name = repository.trim();
  if (!name || name === ALL_REPOSITORIES_VALUE) return undefined;
  return name;
}

export function usePullRequestList({
  project,
  team,
  defaultRepository,
}: UsePullRequestListParams) {
  const projectName = project?.trim() ?? "";
  const [filters, setFilters] = useState(() => initialFilters(defaultRepository));
  const peopleQuery = useTeamMembers({
    project,
    team,
    enabled: Boolean(project && team),
  });
  const repositories = useGitRepositories(project);

  const status = tabToStatus(filters.tab);
  const repository = scopedRepository(filters.repository);
  const requestKey = `${projectName}|${status}|${repository ?? ALL_REPOSITORIES_VALUE}`;
  const [snapshot, setSnapshot] = useState<ListSnapshot>({
    key: "",
    items: [],
    activeCount: 0,
    error: null,
  });

  useEffect(() => {
    if (!defaultRepository) return;
    setFilters((current) => {
      if (current.repository !== ALL_REPOSITORIES_VALUE) return current;
      return { ...current, repository: defaultRepository };
    });
  }, [defaultRepository]);

  useEffect(() => {
    if (!projectName) return;

    const controller = new AbortController();

    void fetchPullRequestList(
      { project: projectName, status, repository },
      controller.signal,
    ).then((result) => {
      if (controller.signal.aborted) return;
      if (result.ok) {
        setSnapshot({
          key: requestKey,
          items: result.items,
          activeCount: result.activeCount,
          error: null,
        });
        return;
      }
      setSnapshot({
        key: requestKey,
        items: [],
        activeCount: 0,
        error: result.error,
      });
    });

    return () => controller.abort();
  }, [projectName, repository, requestKey, status]);

  const loading = Boolean(projectName) && snapshot.key !== requestKey;
  const items = useMemo(
    () => filterPullRequests(snapshot.items, filters),
    [filters, snapshot.items],
  );

  return {
    filters,
    items,
    activeCount: snapshot.activeCount,
    loading,
    error: loading ? null : snapshot.error,
    hasActiveFilters: hasActivePullRequestFilters(filters),
    people: {
      members: peopleQuery.members,
      membersLoading: peopleQuery.loading,
      membersError: peopleQuery.error,
    },
    repositories: {
      names: repositories.names,
      loading: repositories.loading,
    },
    setSearch: (search: string) => setFilters((current) => ({ ...current, search })),
    setTab: (tab: PullRequestTab) => setFilters((current) => ({ ...current, tab })),
    setFilters,
  };
}
