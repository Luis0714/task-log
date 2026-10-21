import { durationBetween } from "@/lib/review-times/duration";
import type { ReviewTimeAverages, ReviewTimeRow } from "@/lib/review-times/types";

export function averageMilliseconds(values: readonly number[]): number | null {
  if (values.length === 0) return null;
  const total = values.reduce((sum, value) => sum + value, 0);
  return Math.round(total / values.length);
}

function collect(
  rows: readonly ReviewTimeRow[],
  timeZone: string,
  endOf: (row: ReviewTimeRow) => string | null,
  countCompletedWithoutReviewer: boolean,
): number[] {
  const values: number[] = [];
  for (const row of rows) {
    if (!row.reviewerId) {
      if (countCompletedWithoutReviewer && row.isCompleted) values.push(0);
      continue;
    }
    const end = endOf(row);
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
  const review = collect(rows, timeZone, (row) => row.reviewedAt, false);
  const approval = collect(rows, timeZone, (row) => row.approvedAt, true);
  return {
    reviewMs: averageMilliseconds(review),
    reviewCount: review.length,
    approvalMs: averageMilliseconds(approval),
    approvalCount: approval.length,
  };
}
