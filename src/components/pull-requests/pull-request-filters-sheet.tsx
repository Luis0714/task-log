"use client";

import { FiltersBottomSheet } from "@/components/filters/filters-bottom-sheet";
import { PullRequestFiltersForm } from "@/components/pull-requests/pull-request-filters-form";
import type { PullRequestFiltersFormModel } from "@/lib/pull-requests/filter-form-model";

export type PullRequestFiltersSheetProps = PullRequestFiltersFormModel & {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function PullRequestFiltersSheet({
  open,
  onOpenChange,
  filters,
  people,
  repositories,
  onChange,
}: PullRequestFiltersSheetProps) {
  return (
    <FiltersBottomSheet open={open} onOpenChange={onOpenChange} title="Filtros">
      <PullRequestFiltersForm
        filters={filters}
        people={people}
        repositories={repositories}
        onChange={onChange}
      />
    </FiltersBottomSheet>
  );
}
