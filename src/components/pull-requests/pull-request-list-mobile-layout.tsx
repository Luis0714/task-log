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
  return (
    <div className="flex min-h-0 w-full flex-1 flex-col gap-4 pb-20 md:hidden">
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
      />

      <CreateFab
        label={CREATE_PULL_REQUEST_FAB_LABEL}
        icon={<Plus />}
        href={createHref}
      />

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
