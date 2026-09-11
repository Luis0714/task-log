"use client";

import { Plus } from "lucide-react";

import { PullRequestEmpty } from "@/components/pull-requests/pull-request-empty";
import { PullRequestFiltersPanel } from "@/components/pull-requests/pull-request-filters-panel";
import { PullRequestList } from "@/components/pull-requests/pull-request-list";
import { PullRequestQuickTabs } from "@/components/pull-requests/pull-request-quick-tabs";
import { SearchField } from "@/components/shared/search-field";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import { PULL_REQUEST_SEARCH_PLACEHOLDER } from "@/lib/pull-requests/copy";
import type { PullRequestFiltersFormModel } from "@/lib/pull-requests/filter-form-model";
import type { PullRequestListItem, PullRequestTab } from "@/lib/pull-requests/types";

export type PullRequestListDesktopLayoutProps = PullRequestFiltersFormModel & {
  title: string;
  description: string;
  items: readonly PullRequestListItem[];
  hasActiveFilters: boolean;
  onSearchChange: (value: string) => void;
  onTabChange: (tab: PullRequestTab) => void;
};

export function PullRequestListDesktopLayout({
  title,
  description,
  items,
  hasActiveFilters,
  filters,
  people,
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
          <Button type="button">
            <Plus />
            Nueva Pull Request
          </Button>
        }
      />

      <div className="flex min-h-0 flex-1 gap-4">
        <PullRequestFiltersPanel filters={filters} people={people} onChange={onChange} />

        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <SearchField
            id="pull-request-search-desktop"
            value={filters.search}
            onValueChange={onSearchChange}
            placeholder={PULL_REQUEST_SEARCH_PLACEHOLDER}
          />
          <PullRequestQuickTabs value={filters.tab} onValueChange={onTabChange} />
          {items.length === 0 ? (
            <PullRequestEmpty hasActiveFilters={hasActiveFilters} />
          ) : (
            <PullRequestList items={items} density="comfortable" />
          )}
        </div>
      </div>
    </div>
  );
}
