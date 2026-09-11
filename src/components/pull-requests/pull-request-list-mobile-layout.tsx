"use client";

import { Plus, SlidersHorizontal } from "lucide-react";

import { PullRequestEmpty } from "@/components/pull-requests/pull-request-empty";
import { PullRequestFiltersSheet } from "@/components/pull-requests/pull-request-filters-sheet";
import { PullRequestList } from "@/components/pull-requests/pull-request-list";
import { PullRequestQuickTabs } from "@/components/pull-requests/pull-request-quick-tabs";
import { CreateFab } from "@/components/shared/create-fab";
import { SearchField } from "@/components/shared/search-field";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import type {
  PullRequestFilterState,
  PullRequestListItem,
  PullRequestTab,
} from "@/lib/pull-requests/types";

export type PullRequestListMobileLayoutProps = {
  title: string;
  description: string;
  items: readonly PullRequestListItem[];
  hasActiveFilters: boolean;
  filters: PullRequestFilterState;
  filtersOpen: boolean;
  onFiltersOpenChange: (open: boolean) => void;
  projects: readonly string[];
  repositories: readonly string[];
  authors: readonly string[];
  onFiltersChange: (next: PullRequestFilterState) => void;
  onSearchChange: (value: string) => void;
  onTabChange: (tab: PullRequestTab) => void;
};

export function PullRequestListMobileLayout({
  title,
  description,
  items,
  hasActiveFilters,
  filters,
  filtersOpen,
  onFiltersOpenChange,
  projects,
  repositories,
  authors,
  onFiltersChange,
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
          placeholder="Buscar por ID, rama o autor…"
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

      {items.length === 0 ? (
        <PullRequestEmpty hasActiveFilters={hasActiveFilters} />
      ) : (
        <PullRequestList items={items} density="compact" />
      )}

      <CreateFab label="Crear PR" icon={<Plus />} />

      <PullRequestFiltersSheet
        open={filtersOpen}
        onOpenChange={onFiltersOpenChange}
        filters={filters}
        projects={projects}
        repositories={repositories}
        authors={authors}
        onChange={onFiltersChange}
      />
    </div>
  );
}
