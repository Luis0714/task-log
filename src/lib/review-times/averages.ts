import { durationBetween } from "@/lib/review-times/duration";
import type { ReviewTimeAverages, ReviewTimeRow } from "@/lib/review-times/types";

export function averageMilliseconds(values: readonly number[]): number | null {
  if (values.length === 0) return null;
  const total = values.reduce((sum, value) => sum + value, 0);
  return Math.round(total / values.length);
}

function collect(rows: readonly ReviewTimeRow[], endOf: (row: ReviewTimeRow) => string | null): number[] {
  const values: number[] = [];
  for (const row of rows) {
    if (!row.reviewerId) continue;
    const end = endOf(row);
    if (!end) continue;
    const ms = durationBetween(row.createdAt, end);
    if (ms != null) values.push(ms);
  }
  return values;
}

export function reviewTimeAverages(rows: readonly ReviewTimeRow[]): ReviewTimeAverages {
  const review = collect(rows, (row) => row.reviewedAt);
  const approval = collect(rows, (row) => row.approvedAt);
  return {
    reviewMs: averageMilliseconds(review),
    reviewCount: review.length,
    approvalMs: averageMilliseconds(approval),
    approvalCount: approval.length,
  };
}
