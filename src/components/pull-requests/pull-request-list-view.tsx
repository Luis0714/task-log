"use client";

import { useState } from "react";

import { PullRequestListDesktopLayout } from "@/components/pull-requests/pull-request-list-desktop-layout";
import { PullRequestListMobileLayout } from "@/components/pull-requests/pull-request-list-mobile-layout";
import { usePullRequestList } from "@/hooks/pull-requests/use-pull-request-list";
import { NEW_PULL_REQUEST_PATH } from "@/lib/pull-requests/create-query";

export type PullRequestListViewProps = {
  title: string;
  project: string | null;
  team: string | null;
  defaultRepository: string | null;
};

export function PullRequestListView({
  title,
  project,
  team,
  defaultRepository,
}: PullRequestListViewProps) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const list = usePullRequestList({ project, team, defaultRepository });
  const description = list.loading
    ? "Cargando pull requests..."
    : `${list.activeCount} PRs activos`;

  return (
    <>
      <PullRequestListMobileLayout
        title={title}
        description={description}
        items={list.items}
        loading={list.loading}
        error={list.error}
        hasActiveFilters={list.hasActiveFilters}
        filters={list.filters}
        people={list.people}
        repositories={list.repositories}
        createHref={NEW_PULL_REQUEST_PATH}
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
        loading={list.loading}
        error={list.error}
        hasActiveFilters={list.hasActiveFilters}
        filters={list.filters}
        people={list.people}
        repositories={list.repositories}
        createHref={NEW_PULL_REQUEST_PATH}
        onChange={list.setFilters}
        onSearchChange={list.setSearch}
        onTabChange={list.setTab}
      />
    </>
  );
}
