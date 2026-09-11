import {
  ANY_FILTER_VALUE,
  ME_FILTER_VALUE,
  type PullRequestFilterState,
  type PullRequestListItem,
} from "@/lib/pull-requests/types";

function matchesSearch(item: PullRequestListItem, search: string): boolean {
  const query = search.trim().toLowerCase();
  if (!query) return true;

  const haystack = [
    String(item.id),
    item.title,
    item.author,
    item.sourceBranch,
    item.targetBranch,
    item.repository,
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(query);
}

function matchesTab(item: PullRequestListItem, tab: PullRequestFilterState["tab"]): boolean {
  if (tab === "mine") return item.isMine;
  if (tab === "to_review") return item.needsMyReview;
  if (tab === "pending") return item.isPending;
  return true;
}

function matchesPrStatus(
  item: PullRequestListItem,
  prStatus: PullRequestFilterState["prStatus"],
): boolean {
  if (prStatus === "all") return true;
  if (prStatus === "active") {
    return item.status !== "draft" && item.status !== "approved";
  }
  if (prStatus === "approved") return item.status === "approved";
  if (prStatus === "changes_requested") return item.status === "changes_requested";
  return item.status === "draft";
}

export function filterPullRequests(
  items: readonly PullRequestListItem[],
  filters: PullRequestFilterState,
): PullRequestListItem[] {
  return items.filter((item) => {
    if (!matchesSearch(item, filters.search)) return false;
    if (!matchesTab(item, filters.tab)) return false;
    if (filters.projects.length > 0 && !filters.projects.includes(item.project)) {
      return false;
    }
    if (
      filters.repositories.length > 0 &&
      !filters.repositories.includes(item.repository)
    ) {
      return false;
    }
    if (!matchesPrStatus(item, filters.prStatus)) return false;
    if (filters.author !== ANY_FILTER_VALUE && item.author !== filters.author) {
      return false;
    }
    if (filters.reviewer === ME_FILTER_VALUE && !item.needsMyReview) return false;
    return true;
  });
}
