import {
  ANY_FILTER_VALUE,
  type PullRequestFilterState,
  type PullRequestListItem,
} from "@/lib/pull-requests/types";

export function hasActivePullRequestFilters(filters: PullRequestFilterState): boolean {
  return (
    filters.search.trim().length > 0 ||
    filters.tab !== "all" ||
    filters.projects.length > 0 ||
    filters.repositories.length > 0 ||
    filters.prStatus !== "all" ||
    filters.author !== ANY_FILTER_VALUE ||
    filters.reviewer !== ANY_FILTER_VALUE
  );
}

export function uniqueAuthors(items: readonly PullRequestListItem[]): string[] {
  return [...new Set(items.map((item) => item.author))].sort((a, b) =>
    a.localeCompare(b, "es"),
  );
}
