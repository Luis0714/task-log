"use client";

import { durationBetween, formatOpenDuration, formatReviewDuration } from "@/lib/review-times/duration";
import { formatReviewDate } from "@/lib/review-times/format-review-date";
import type { ReviewTimeRow } from "@/lib/review-times/types";

export function ReviewDate({
  iso,
  timeZone,
}: Readonly<{ iso: string | null; timeZone: string }>) {
  if (!iso) return <span className="text-muted-foreground">—</span>;
  return <span className="tabular-nums">{formatReviewDate(iso, timeZone)}</span>;
}

export function FirstReviewDuration({
  row,
  firstReviewedAt,
  timeZone,
}: Readonly<{
  row: ReviewTimeRow;
  firstReviewedAt: string | null;
  timeZone: string;
}>) {
  if (firstReviewedAt) {
    const ms = durationBetween(row.createdAt, firstReviewedAt, timeZone);
    return (
      <span className="font-semibold tabular-nums">
        {ms == null ? "—" : formatReviewDuration(ms)}
      </span>
    );
  }

  if (!row.reviewerId || row.isCompleted) {
    return <span className="text-muted-foreground">—</span>;
  }

  const waiting = durationBetween(row.createdAt, new Date().toISOString(), timeZone);
  return (
    <span className="font-semibold tabular-nums">
      {waiting == null ? "—" : formatOpenDuration(waiting)}
    </span>
  );
}

export function ApprovalDuration({
  row,
  timeZone,
}: Readonly<{ row: ReviewTimeRow; timeZone: string }>) {
  if (row.approvedAt) {
    const ms = durationBetween(row.createdAt, row.approvedAt, timeZone);
    return (
      <span className="font-semibold tabular-nums">
        {ms == null ? "—" : formatReviewDuration(ms)}
      </span>
    );
  }

  if (!row.reviewerId) {
    if (row.isCompleted) {
      return <span className="font-semibold tabular-nums">{formatReviewDuration(0)}</span>;
    }
    return <span className="text-muted-foreground">—</span>;
  }

  const waiting = durationBetween(row.createdAt, new Date().toISOString(), timeZone);
  return (
    <span className="font-semibold tabular-nums">
      {waiting == null ? "—" : formatOpenDuration(waiting)}
    </span>
  );
}
