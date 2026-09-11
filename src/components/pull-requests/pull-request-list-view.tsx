"use client";

import { useState } from "react";

import { PullRequestListDesktopLayout } from "@/components/pull-requests/pull-request-list-desktop-layout";
import { PullRequestListMobileLayout } from "@/components/pull-requests/pull-request-list-mobile-layout";
import { usePullRequestListMock } from "@/hooks/pull-requests/use-pull-request-list-mock";

export type PullRequestListViewProps = {
  title: string;
};

export function PullRequestListView({ title }: PullRequestListViewProps) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const list = usePullRequestListMock();
  const description = `${list.activeCount} PRs activos`;

  return (
    <>
      <PullRequestListMobileLayout
        title={title}
        description={description}
        items={list.items}
        hasActiveFilters={list.hasActiveFilters}
        filters={list.filters}
        filtersOpen={filtersOpen}
        onFiltersOpenChange={setFiltersOpen}
        projects={list.projects}
        repositories={list.repositories}
        authors={list.authors}
        onFiltersChange={list.setFilters}
        onSearchChange={list.setSearch}
        onTabChange={list.setTab}
      />
      <PullRequestListDesktopLayout
        title={title}
        description={description}
        items={list.items}
        hasActiveFilters={list.hasActiveFilters}
        filters={list.filters}
        projects={list.projects}
        repositories={list.repositories}
        authors={list.authors}
        onFiltersChange={list.setFilters}
        onSearchChange={list.setSearch}
        onTabChange={list.setTab}
      />
    </>
  );
}
