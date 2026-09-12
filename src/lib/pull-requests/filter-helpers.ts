import { ANY_FILTER_VALUE, type PullRequestFilterState } from "@/lib/pull-requests/types";

export function hasActivePullRequestFilters(filters: PullRequestFilterState): boolean {
  return (
    filters.search.trim().length > 0 ||
    filters.createdBy !== ANY_FILTER_VALUE ||
    filters.assignedTo !== ANY_FILTER_VALUE
  );
}
