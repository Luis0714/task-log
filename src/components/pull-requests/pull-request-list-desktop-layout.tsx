"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { PullRequestFiltersPanel } from "@/components/pull-requests/pull-request-filters-panel";
import { PullRequestListBody } from "@/components/pull-requests/pull-request-list-body";
import { PullRequestQuickTabs } from "@/components/pull-requests/pull-request-quick-tabs";
import { SearchField } from "@/components/shared/search-field";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import {
  NEW_PULL_REQUEST_LABEL,
  PULL_REQUEST_SEARCH_PLACEHOLDER,
} from "@/lib/pull-requests/copy";
import type { PullRequestFiltersFormModel } from "@/lib/pull-requests/filter-form-model";
import type { PullRequestListItem, PullRequestTab } from "@/lib/pull-requests/types";

export type PullRequestListDesktopLayoutProps = PullRequestFiltersFormModel & {
  title: string;
  description: string;
  items: readonly PullRequestListItem[];
  loading: boolean;
  error: string | null;
  hasActiveFilters: boolean;
  notice?: ReactNode;
  createHref: string;
  onSearchChange: (value: string) => void;
  onTabChange: (tab: PullRequestTab) => void;
};

export function PullRequestListDesktopLayout({
  title,
  description,
  items,
  loading,
  error,
  hasActiveFilters,
  filters,
  people,
  repositories,
  notice,
  createHref,
  onChange,
  onSearchChange,
  onTabChange,
}: PullRequestListDesktopLayoutProps) {
  return (
    <div className="hidden min-h-0 w-full flex-1 flex-col gap-4 md:flex">
      <PageHeader
        title={title}
        description={description}
        action={
          <Button type="button" nativeButton={false} render={<Link href={createHref} />}>
            <Plus />
            {NEW_PULL_REQUEST_LABEL}
          </Button>
        }
      />

      <div className="flex min-h-0 flex-1 gap-4">
        <PullRequestFiltersPanel
          filters={filters}
          people={people}
          repositories={repositories}
          onChange={onChange}
        />

        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <SearchField
            id="pull-request-search-desktop"
            value={filters.search}
            onValueChange={onSearchChange}
            placeholder={PULL_REQUEST_SEARCH_PLACEHOLDER}
          />
          <PullRequestQuickTabs value={filters.tab} onValueChange={onTabChange} />
          {notice}
          <PullRequestListBody
            items={items}
            density="comfortable"
            loading={loading}
            error={error}
            hasActiveFilters={hasActiveFilters}
          />
        </div>
      </div>
    </div>
  );
}
