"use client";

import type { ReactNode } from "react";
import { Plus, SlidersHorizontal } from "lucide-react";

import { PullRequestFiltersSheet } from "@/components/pull-requests/pull-request-filters-sheet";
import { PullRequestListBody } from "@/components/pull-requests/pull-request-list-body";
import { PullRequestQuickTabs } from "@/components/pull-requests/pull-request-quick-tabs";
import { CreateFab } from "@/components/shared/create-fab";
import { SearchField } from "@/components/shared/search-field";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import { cn } from "@/lib/utils";
import {
  CREATE_PULL_REQUEST_FAB_LABEL,
  PULL_REQUEST_SEARCH_PLACEHOLDER,
} from "@/lib/pull-requests/copy";
import type { PullRequestFiltersFormModel } from "@/lib/pull-requests/filter-form-model";
import type { PullRequestListItem, PullRequestTab } from "@/lib/pull-requests/types";

export type PullRequestListMobileLayoutProps = PullRequestFiltersFormModel & {
  title: string;
  description: string;
  items: readonly PullRequestListItem[];
  loading: boolean;
  error: string | null;
  hasActiveFilters: boolean;
  notice?: ReactNode;
  createHref: string;
  filtersOpen: boolean;
  onFiltersOpenChange: (open: boolean) => void;
  onSearchChange: (value: string) => void;
  onTabChange: (tab: PullRequestTab) => void;
};

export function PullRequestListMobileLayout({
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
  filtersOpen,
  onFiltersOpenChange,
  onChange,
  onSearchChange,
  onTabChange,
}: PullRequestListMobileLayoutProps) {
  const showCreateFab = !loading && !error && items.length > 0;

  return (
    <div
      className={cn(
        "flex min-h-0 w-full flex-1 flex-col gap-4 md:hidden",
        showCreateFab && "pb-20",
      )}
    >
      <PageHeader title={title} description={description} />

      <div className="flex items-center gap-2">
        <SearchField
          id="pull-request-search-mobile"
          value={filters.search}
          onValueChange={onSearchChange}
          placeholder={PULL_REQUEST_SEARCH_PLACEHOLDER}
          className="flex-1"
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => onFiltersOpenChange(true)}
        >
          <SlidersHorizontal />
          Filtros
        </Button>
      </div>

      <PullRequestQuickTabs value={filters.tab} onValueChange={onTabChange} />

      {notice}

      <PullRequestListBody
        items={items}
        density="compact"
        loading={loading}
        error={error}
        hasActiveFilters={hasActiveFilters}
        createHref={createHref}
      />

      {showCreateFab ? (
        <CreateFab
          label={CREATE_PULL_REQUEST_FAB_LABEL}
          icon={<Plus />}
          href={createHref}
        />
      ) : null}

      <PullRequestFiltersSheet
        open={filtersOpen}
        onOpenChange={onFiltersOpenChange}
        filters={filters}
        people={people}
        repositories={repositories}
        onChange={onChange}
      />
    </div>
  );
}
