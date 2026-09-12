import type { ReleaseFilters } from "@/lib/releases/filters";

export type ReleaseFilterOptions = {
  createdBy: readonly string[];
  branches: readonly string[];
  environments: readonly string[];
};

export type ReleaseFiltersFormModel = {
  filters: ReleaseFilters;
  options: ReleaseFilterOptions;
  onChange: (filters: ReleaseFilters) => void;
};
