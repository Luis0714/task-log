import { durationBetween } from "@/lib/review-times/duration";
import type { ReviewTimeAverages, ReviewTimeRow } from "@/lib/review-times/types";

export function averageMilliseconds(values: readonly number[]): number | null {
  if (values.length === 0) return null;
  const total = values.reduce((sum, value) => sum + value, 0);
  return Math.round(total / values.length);
}

function earliestByPullRequest(
  rows: readonly ReviewTimeRow[],
  at: (row: ReviewTimeRow) => string | null,
): ReadonlyMap<number, string> {
  const first = new Map<number, string>();
  for (const row of rows) {
    if (!row.reviewerId) continue;
    const instant = at(row);
    if (!instant) continue;
    const current = first.get(row.pullRequestId);
    if (!current || instant < current) first.set(row.pullRequestId, instant);
  }
  return first;
}

export function firstReviewedAtByPullRequest(
  rows: readonly ReviewTimeRow[],
): ReadonlyMap<number, string> {
  return earliestByPullRequest(rows, (row) => row.reviewedAt);
}

function durationSamples(
  rows: readonly ReviewTimeRow[],
  timeZone: string,
  ends: ReadonlyMap<number, string>,
): number[] {
  const seen = new Set<number>();
  const values: number[] = [];
  for (const row of rows) {
    if (seen.has(row.pullRequestId)) continue;
    seen.add(row.pullRequestId);
    const end = ends.get(row.pullRequestId);
    if (!end) continue;
    const ms = durationBetween(row.createdAt, end, timeZone);
    if (ms != null) values.push(ms);
  }
  return values;
}

export function reviewTimeAverages(
  rows: readonly ReviewTimeRow[],
  timeZone: string,
): ReviewTimeAverages {
  const review = durationSamples(rows, timeZone, firstReviewedAtByPullRequest(rows));
  const approval = durationSamples(
    rows,
    timeZone,
    earliestByPullRequest(rows, (row) => row.approvedAt),
  );
  return {
    reviewMs: averageMilliseconds(review),
    reviewCount: review.length,
    approvalMs: averageMilliseconds(approval),
    approvalCount: approval.length,
  };
}
