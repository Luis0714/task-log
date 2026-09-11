"use client";

import { useState } from "react";

import { PullRequestListDesktopLayout } from "@/components/pull-requests/pull-request-list-desktop-layout";
import { PullRequestListMobileLayout } from "@/components/pull-requests/pull-request-list-mobile-layout";
import { usePullRequestListMock } from "@/hooks/pull-requests/use-pull-request-list-mock";

export type PullRequestListViewProps = {
  title: string;
  project: string | null;
  team: string | null;
};

export function PullRequestListView({
  title,
  project,
  team,
}: PullRequestListViewProps) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const list = usePullRequestListMock({ project, team });
  const description = `${list.activeCount} PRs activos`;

  return (
    <>
      <PullRequestListMobileLayout
        title={title}
        description={description}
        items={list.items}
        hasActiveFilters={list.hasActiveFilters}
        filters={list.filters}
        people={list.people}
        filtersOpen={filtersOpen}
        onFiltersOpenChange={setFiltersOpen}
        onChange={list.setFilters}
        onSearchChange={list.setSearch}
        onTabChange={list.setTab}
      />
      <PullRequestListDesktopLayout
        title={title}
        description={description}
        items={list.items}
        hasActiveFilters={list.hasActiveFilters}
        filters={list.filters}
        people={list.people}
        onChange={list.setFilters}
        onSearchChange={list.setSearch}
        onTabChange={list.setTab}
      />
    </>
  );
}
