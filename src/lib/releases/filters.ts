import type { ReleaseListItem, ReleaseStageStatus } from "@/lib/releases/types";

export const ALL_RELEASE_FILTER_VALUE = "all";

export type ReleaseFilters = {
  createdBy: string;
  branch: string;
  environment: string;
  status: string;
};

export const EMPTY_RELEASE_FILTERS: ReleaseFilters = {
  createdBy: ALL_RELEASE_FILTER_VALUE,
  branch: ALL_RELEASE_FILTER_VALUE,
  environment: ALL_RELEASE_FILTER_VALUE,
  status: ALL_RELEASE_FILTER_VALUE,
};

export function isReleaseFilterActive(filters: ReleaseFilters): boolean {
  return (
    filters.createdBy !== ALL_RELEASE_FILTER_VALUE ||
    filters.branch !== ALL_RELEASE_FILTER_VALUE ||
    filters.environment !== ALL_RELEASE_FILTER_VALUE ||
    filters.status !== ALL_RELEASE_FILTER_VALUE
  );
}

export function releaseActiveFilterCount(filters: ReleaseFilters): number {
  return (
    Number(filters.createdBy !== ALL_RELEASE_FILTER_VALUE) +
    Number(filters.branch !== ALL_RELEASE_FILTER_VALUE) +
    Number(filters.environment !== ALL_RELEASE_FILTER_VALUE) +
    Number(filters.status !== ALL_RELEASE_FILTER_VALUE)
  );
}

export function matchesReleaseFilters(
  item: ReleaseListItem,
  filters: ReleaseFilters,
): boolean {
  if (
    filters.createdBy !== ALL_RELEASE_FILTER_VALUE &&
    item.createdBy !== filters.createdBy
  ) {
    return false;
  }
  if (filters.branch !== ALL_RELEASE_FILTER_VALUE && item.branch !== filters.branch) {
    return false;
  }
  if (
    filters.environment !== ALL_RELEASE_FILTER_VALUE &&
    !item.stages.some(
      (stage) =>
        stage.shortName === filters.environment || stage.name === filters.environment,
    )
  ) {
    return false;
  }
  if (
    filters.status !== ALL_RELEASE_FILTER_VALUE &&
    !item.stages.some((stage) => stage.status === (filters.status as ReleaseStageStatus))
  ) {
    return false;
  }
  return true;
}

function uniqueSorted(values: readonly string[]): string[] {
  return [...new Set(values.filter((value) => value.trim() && value !== "—"))].sort(
    (left, right) => left.localeCompare(right, "es"),
  );
}

export function releaseCreatedByOptions(items: readonly ReleaseListItem[]): string[] {
  return uniqueSorted(items.map((item) => item.createdBy));
}

export function releaseBranchOptions(items: readonly ReleaseListItem[]): string[] {
  return uniqueSorted(items.map((item) => item.branch));
}

export function releaseEnvironmentOptions(items: readonly ReleaseListItem[]): string[] {
  return uniqueSorted(items.flatMap((item) => item.stages.map((stage) => stage.shortName)));
}
