import Link from "next/link";

import { ReviewDuration } from "@/components/reports/review-times/review-duration";
import { buildPullRequestDetailHref } from "@/lib/pull-requests/detail-path";
import { formatReviewDate } from "@/lib/review-times/format-review-date";
import type { ReviewTimeRow } from "@/lib/review-times/types";

export function readyLabel(row: ReviewTimeRow, timeZone: string): string {
  if (row.readyState === "none") return "Sin pasos automáticos";
  if (row.readyState === "pending") return "Pendiente";
  return formatReviewDate(row.readyAt, timeZone) || "Listo";
}

export function ReviewTimesRowCard({
  row,
  timeZone,
}: Readonly<{ row: ReviewTimeRow; timeZone: string }>) {
  return (
    <article className="flex flex-col gap-3">
      <div className="min-w-0">
        <Link
          href={buildPullRequestDetailHref(row.pullRequestId, row.repository)}
          className="font-medium hover:underline"
        >
          #{row.pullRequestId} {row.title}
        </Link>
        <p className="text-muted-foreground text-xs">
          {row.authorName} · revisor {row.reviewerName}
          {row.isDraft ? " · Borrador" : ""}
        </p>
        <p className="text-muted-foreground text-xs">{row.repository}</p>
      </div>
      <DurationLine label="Creación → revisión" row={row} kind="review" timeZone={timeZone} />
      <DurationLine label="Revisión → aprobación" row={row} kind="approval" timeZone={timeZone} />
      <DurationLine label="Creación → aprobación" row={row} kind="total" timeZone={timeZone} />
      <p className="text-muted-foreground text-xs">
        Listo para aprobar{" "}
        <span className="text-foreground">{readyLabel(row, timeZone)}</span>
      </p>
    </article>
  );
}

function DurationLine({
  label,
  row,
  kind,
  timeZone,
}: Readonly<{
  label: string;
  row: ReviewTimeRow;
  kind: "review" | "approval" | "total";
  timeZone: string;
}>) {
  const segment = segmentOf(row, kind);
  return (
    <div className="flex items-start justify-between gap-3">
      <p className="text-muted-foreground text-xs">{label}</p>
      <ReviewDuration {...segment} timeZone={timeZone} />
    </div>
  );
}

export function segmentOf(row: ReviewTimeRow, kind: "review" | "approval" | "total") {
  if (kind === "review") {
    return {
      start: row.reviewedAt ? row.createdAt : null,
      end: row.reviewedAt,
      openFrom: row.reviewerId && !row.reviewedAt ? row.createdAt : null,
    };
  }
  if (kind === "approval") {
    return {
      start: row.reviewedAt && row.approvedAt ? row.reviewedAt : null,
      end: row.approvedAt,
      openFrom: row.reviewedAt && !row.approvedAt ? row.reviewedAt : null,
    };
  }
  return {
    start: row.approvedAt ? row.createdAt : null,
    end: row.approvedAt,
    openFrom: null,
  };
}
