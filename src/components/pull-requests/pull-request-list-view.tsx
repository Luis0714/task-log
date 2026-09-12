"use client";

import { useState } from "react";

import { PullRequestListDesktopLayout } from "@/components/pull-requests/pull-request-list-desktop-layout";
import { PullRequestListMobileLayout } from "@/components/pull-requests/pull-request-list-mobile-layout";
import { RecentPushedBranchBanner } from "@/components/pull-requests/recent-pushed-branch-banner";
import { usePullRequestList } from "@/hooks/pull-requests/use-pull-request-list";
import { useRecentPushedBranchMock } from "@/hooks/pull-requests/use-recent-pushed-branch-mock";
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
  const recentPush = useRecentPushedBranchMock();
  const description = list.loading
    ? "Cargando pull requests..."
    : `${list.activeCount} PRs activos`;
  const notice = recentPush.suggestion ? (
    <RecentPushedBranchBanner
      suggestion={recentPush.suggestion}
      pushedAt={recentPush.pushedAt}
      onDismiss={recentPush.dismiss}
    />
  ) : null;

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
        notice={notice}
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
        notice={notice}
        createHref={NEW_PULL_REQUEST_PATH}
        onChange={list.setFilters}
        onSearchChange={list.setSearch}
        onTabChange={list.setTab}
      />
    </>
  );
}
