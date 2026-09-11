"use client";

import { useMemo, useState } from "react";

import { filterPullRequests } from "@/lib/pull-requests/filter-pull-requests";
import { hasActivePullRequestFilters } from "@/lib/pull-requests/filter-helpers";
import { MOCK_PULL_REQUESTS } from "@/lib/pull-requests/mock-pull-requests";
import {
  ANY_FILTER_VALUE,
  type PullRequestFilterState,
  type PullRequestTab,
} from "@/lib/pull-requests/types";
import { useTeamMembers } from "@/hooks/use-team-members";

const INITIAL_FILTERS: PullRequestFilterState = {
  search: "",
  tab: "active",
  createdBy: ANY_FILTER_VALUE,
  assignedTo: ANY_FILTER_VALUE,
};

export type UsePullRequestListMockParams = {
  project: string | null;
  team: string | null;
};

export function usePullRequestListMock({
  project,
  team,
}: UsePullRequestListMockParams) {
  const [filters, setFilters] = useState<PullRequestFilterState>(INITIAL_FILTERS);
  const peopleQuery = useTeamMembers({
    project,
    team,
    enabled: Boolean(project && team),
  });

  const items = useMemo(
    () => filterPullRequests(MOCK_PULL_REQUESTS, filters),
    [filters],
  );

  const activeCount = MOCK_PULL_REQUESTS.filter(
    (item) => item.lifecycleStatus === "active",
  ).length;

  return {
    filters,
    items,
    activeCount,
    hasActiveFilters: hasActivePullRequestFilters(filters),
    people: {
      members: peopleQuery.members,
      membersLoading: peopleQuery.loading,
      membersError: peopleQuery.error,
    },
    setSearch: (search: string) => setFilters((current) => ({ ...current, search })),
    setTab: (tab: PullRequestTab) => setFilters((current) => ({ ...current, tab })),
    setFilters,
  };
}
