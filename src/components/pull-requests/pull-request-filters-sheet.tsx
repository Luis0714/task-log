"use client";

import { FiltersBottomSheet } from "@/components/filters/filters-bottom-sheet";
import { PullRequestFiltersForm } from "@/components/pull-requests/pull-request-filters-form";
import type { PullRequestFilterState } from "@/lib/pull-requests/types";

export type PullRequestFiltersSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: PullRequestFilterState;
  projects: readonly string[];
  repositories: readonly string[];
  authors: readonly string[];
  onChange: (next: PullRequestFilterState) => void;
};

export function PullRequestFiltersSheet({
  open,
  onOpenChange,
  filters,
  projects,
  repositories,
  authors,
  onChange,
}: PullRequestFiltersSheetProps) {
  return (
    <FiltersBottomSheet open={open} onOpenChange={onOpenChange} title="Filtros rápidos">
      <PullRequestFiltersForm
        filters={filters}
        projects={projects}
        repositories={repositories}
        authors={authors}
        onChange={onChange}
      />
    </FiltersBottomSheet>
  );
}
