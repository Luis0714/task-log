"use client";

import { PageHeader } from "@/components/layout/page-header";
import { ReleaseDefinitionSelect } from "@/components/releases/release-definition-select";
import { ReleaseFiltersButton } from "@/components/releases/release-filters-button";
import { ReleaseFiltersSheet } from "@/components/releases/release-filters-sheet";
import { ReleaseListBody } from "@/components/releases/release-list-body";
import { ReleaseQuickTabs } from "@/components/releases/release-quick-tabs";
import { SearchField } from "@/components/shared/search-field";
import { RELEASE_SEARCH_PLACEHOLDER } from "@/lib/releases/copy";
import type { ReleaseFilterOptions } from "@/lib/releases/filter-form-model";
import type { ReleaseFilters } from "@/lib/releases/filters";
import type {
  ReleaseDefinitionOption,
  ReleaseListItem,
  ReleaseStage,
  ReleaseTab,
} from "@/lib/releases/types";

export type ReleaseListLayoutProps = {
  title: string;
  description: string;
  search: string;
  tab: ReleaseTab;
  filters: ReleaseFilters;
  filterOptions: ReleaseFilterOptions;
  filtersOpen: boolean;
  activeFilterCount: number;
  definitionId: number | null;
  definitions: readonly ReleaseDefinitionOption[];
  items: readonly ReleaseListItem[];
  totalCount: number;
  pendingCount: number;
  loading: boolean;
  error: string | null;
  hasActiveFilters: boolean;
  disabled?: boolean;
  onSearchChange: (value: string) => void;
  onTabChange: (tab: ReleaseTab) => void;
  onFiltersChange: (filters: ReleaseFilters) => void;
  onFiltersOpenChange: (open: boolean) => void;
  onDefinitionChange: (definitionId: number) => void;
  onApprove?: (item: ReleaseListItem, stage: ReleaseStage) => void;
};

export function ReleaseListLayout({
  title,
  description,
  search,
  tab,
  filters,
  filterOptions,
  filtersOpen,
  activeFilterCount,
  definitionId,
  definitions,
  items,
  totalCount,
  pendingCount,
  loading,
  error,
  hasActiveFilters,
  disabled,
  onSearchChange,
  onTabChange,
  onFiltersChange,
  onFiltersOpenChange,
  onDefinitionChange,
  onApprove,
}: ReleaseListLayoutProps) {
  return (
    <div className="flex min-h-0 w-full flex-1 flex-col gap-4">
      <PageHeader
        title={title}
        description={description}
        action={
          <ReleaseDefinitionSelect
            value={definitionId}
            options={definitions}
            disabled={loading}
            onValueChange={onDefinitionChange}
          />
        }
      />

      <div className="flex items-center gap-2">
        <SearchField
          id="release-search"
          value={search}
          onValueChange={onSearchChange}
          placeholder={RELEASE_SEARCH_PLACEHOLDER}
          className="flex-1"
        />
        <ReleaseFiltersButton
          activeCount={activeFilterCount}
          onClick={() => onFiltersOpenChange(true)}
        />
      </div>

      <ReleaseQuickTabs
        value={tab}
        totalCount={totalCount}
        pendingCount={pendingCount}
        onValueChange={onTabChange}
      />

      <ReleaseListBody
        items={items}
        loading={loading}
        error={error}
        hasActiveFilters={hasActiveFilters}
        disabled={disabled}
        onApprove={onApprove}
      />

      <ReleaseFiltersSheet
        open={filtersOpen}
        onOpenChange={onFiltersOpenChange}
        filters={filters}
        options={filterOptions}
        onChange={onFiltersChange}
      />
    </div>
  );
}
