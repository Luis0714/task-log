"use client";

import { FiltersBottomSheet } from "@/components/filters/filters-bottom-sheet";
import { ReleaseFiltersForm } from "@/components/releases/release-filters-form";
import { RELEASE_FILTERS_TITLE } from "@/lib/releases/copy";
import type { ReleaseFiltersFormModel } from "@/lib/releases/filter-form-model";

export type ReleaseFiltersSheetProps = ReleaseFiltersFormModel & {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ReleaseFiltersSheet({
  open,
  onOpenChange,
  filters,
  options,
  onChange,
}: ReleaseFiltersSheetProps) {
  return (
    <FiltersBottomSheet
      open={open}
      onOpenChange={onOpenChange}
      title={RELEASE_FILTERS_TITLE}
    >
      <ReleaseFiltersForm filters={filters} options={options} onChange={onChange} />
    </FiltersBottomSheet>
  );
}
