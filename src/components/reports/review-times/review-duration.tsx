"use client";

import { durationBetween, formatOpenDuration, formatReviewDuration } from "@/lib/review-times/duration";
import { formatReviewDate } from "@/lib/review-times/format-review-date";

export type ReviewDurationProps = {
  start: string | null;
  end: string | null;
  openFrom: string | null;
  timeZone: string;
};

export function ReviewDuration({ start, end, openFrom, timeZone }: Readonly<ReviewDurationProps>) {
  if (start && end) {
    const ms = durationBetween(start, end);
    return (
      <div className="min-w-0">
        <p className="text-sm font-semibold tabular-nums">
          {ms == null ? "—" : formatReviewDuration(ms)}
        </p>
        <p className="text-muted-foreground text-xs">
          {formatReviewDate(start, timeZone)} → {formatReviewDate(end, timeZone)}
        </p>
      </div>
    );
  }

  if (openFrom) {
    const ms = durationBetween(openFrom, new Date().toISOString());
    return (
      <div className="min-w-0">
        <p className="text-sm font-semibold tabular-nums">
          {ms == null ? "—" : formatOpenDuration(ms)}
        </p>
        <p className="text-muted-foreground text-xs">desde {formatReviewDate(openFrom, timeZone)}</p>
      </div>
    );
  }

  return <span className="text-muted-foreground">—</span>;
}
