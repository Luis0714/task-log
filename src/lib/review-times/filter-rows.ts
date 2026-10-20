import type { ReviewTimeLocalFilters, ReviewTimeRow, ReviewTimeStatus } from "@/lib/review-times/types";

export function reviewTimeStatus(row: {
  reviewedAt: string | null;
  approvedAt: string | null;
}): ReviewTimeStatus {
  if (row.approvedAt) return "approved";
  if (row.reviewedAt) return "reviewed";
  return "pending_review";
}

function matchesSearch(row: ReviewTimeRow, search: string): boolean {
  if (!search) return true;
  const haystack = `${row.pullRequestId} ${row.title}`.toLowerCase();
  return haystack.includes(search);
}

export function filterReviewTimeRows(
  rows: readonly ReviewTimeRow[],
  filters: ReviewTimeLocalFilters,
): ReviewTimeRow[] {
  const reviewers = new Set(filters.reviewerIds);
  const authors = new Set(filters.authorIds);
  const statuses = new Set(filters.statuses);
  const search = filters.search.trim().toLowerCase();

  return sortReviewTimeRows(rows.filter((row) => {
    if (reviewers.size > 0 && (!row.reviewerId || !reviewers.has(row.reviewerId))) return false;
    if (authors.size > 0 && !authors.has(row.authorId)) return false;
    if (statuses.size > 0 && !statuses.has(row.status)) return false;
    return matchesSearch(row, search);
  }));
}

export function sortReviewTimeRows(rows: readonly ReviewTimeRow[]): ReviewTimeRow[] {
  return [...rows].sort((left, right) => {
    const byDate = right.createdAt.localeCompare(left.createdAt);
    if (byDate !== 0) return byDate;
    return right.pullRequestId - left.pullRequestId;
  });
}
