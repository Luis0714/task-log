import {
  ALL_REPOSITORIES_VALUE,
  ANY_FILTER_VALUE,
  ME_FILTER_VALUE,
  type PullRequestFilterState,
  type PullRequestListItem,
} from "@/lib/pull-requests/types";

function matchesSearch(item: PullRequestListItem, search: string): boolean {
  const query = search.trim().toLowerCase();
  if (!query) return true;

  return `${item.id} ${item.title}`.toLowerCase().includes(query);
}

function matchesTab(
  item: PullRequestListItem,
  tab: PullRequestFilterState["tab"],
): boolean {
  if (tab === "mine") return item.isMine || item.needsMyReview;
  return item.lifecycleStatus === tab;
}

export function filterPullRequests(
  items: readonly PullRequestListItem[],
  filters: PullRequestFilterState,
): PullRequestListItem[] {
  return items.filter((item) => {
    if (!matchesSearch(item, filters.search)) return false;
    if (
      filters.repository !== ALL_REPOSITORIES_VALUE &&
      item.repository !== filters.repository
    ) {
      return false;
    }
    if (!matchesTab(item, filters.tab)) return false;
    if (filters.createdBy !== ANY_FILTER_VALUE && item.author !== filters.createdBy) {
      return false;
    }
    if (filters.assignedTo === ME_FILTER_VALUE) return item.needsMyReview;
    if (
      filters.assignedTo !== ANY_FILTER_VALUE &&
      !item.reviewers.includes(filters.assignedTo)
    ) {
      return false;
    }
    return true;
  });
}
