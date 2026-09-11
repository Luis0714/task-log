"use client";

import { useMemo, useState } from "react";

import { filterPullRequests } from "@/lib/pull-requests/filter-pull-requests";
import { hasActivePullRequestFilters, uniqueAuthors } from "@/lib/pull-requests/filter-helpers";
import {
  MOCK_FILTER_PROJECTS,
  MOCK_FILTER_REPOSITORIES,
  MOCK_PULL_REQUESTS,
} from "@/lib/pull-requests/mock-pull-requests";
import {
  ANY_FILTER_VALUE,
  type PullRequestFilterState,
  type PullRequestTab,
} from "@/lib/pull-requests/types";

const INITIAL_FILTERS: PullRequestFilterState = {
  search: "",
  tab: "all",
  projects: [],
  repositories: [],
  prStatus: "all",
  author: ANY_FILTER_VALUE,
  reviewer: ANY_FILTER_VALUE,
};

export function usePullRequestListMock() {
  const [filters, setFilters] = useState<PullRequestFilterState>(INITIAL_FILTERS);

  const items = useMemo(
    () => filterPullRequests(MOCK_PULL_REQUESTS, filters),
    [filters],
  );

  const activeCount = MOCK_PULL_REQUESTS.filter(
    (item) => item.status !== "draft",
  ).length;

  return {
    filters,
    items,
    activeCount,
    hasActiveFilters: hasActivePullRequestFilters(filters),
    projects: MOCK_FILTER_PROJECTS,
    repositories: MOCK_FILTER_REPOSITORIES,
    authors: uniqueAuthors(MOCK_PULL_REQUESTS),
    setSearch: (search: string) => setFilters((current) => ({ ...current, search })),
    setTab: (tab: PullRequestTab) => setFilters((current) => ({ ...current, tab })),
    setFilters,
  };
}
