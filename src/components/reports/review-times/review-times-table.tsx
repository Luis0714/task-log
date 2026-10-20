"use client";

import Link from "next/link";

import {
  readyLabel,
  ReviewTimesRowCard,
  segmentOf,
} from "@/components/reports/review-times/review-times-row-card";
import { ReviewDuration } from "@/components/reports/review-times/review-duration";
import { StickyTable, type StickyTableColumn } from "@/components/ui/sticky-table";
import { buildPullRequestDetailHref } from "@/lib/pull-requests/detail-path";
import type { ReviewTimeRow } from "@/lib/review-times/types";

function columns(timeZone: string): StickyTableColumn<ReviewTimeRow>[] {
  return [
    {
      key: "pullRequest",
      header: "Pull request",
      widthClass: "min-w-56",
      sticky: { leftClass: "left-0", isLast: true },
      bodyClassName: "whitespace-normal",
      render: (row) => (
        <div className="min-w-0">
          <Link
            href={buildPullRequestDetailHref(row.pullRequestId, row.repository)}
            className="font-medium hover:underline"
          >
            #{row.pullRequestId} {row.title}
          </Link>
          <p className="text-muted-foreground text-xs">
            {row.authorName}
            {row.isDraft ? " · Borrador" : ""} · {row.repository}
          </p>
        </div>
      ),
    },
    {
      key: "reviewer",
      header: "Revisor",
      widthClass: "min-w-36",
      bodyClassName: "whitespace-normal",
      render: (row) => row.reviewerName,
    },
    {
      key: "review",
      header: "Creación → revisión",
      widthClass: "min-w-44",
      render: (row) => <ReviewDuration {...segmentOf(row, "review")} timeZone={timeZone} />,
    },
    {
      key: "approval",
      header: "Revisión → aprobación",
      widthClass: "min-w-44",
      render: (row) => <ReviewDuration {...segmentOf(row, "approval")} timeZone={timeZone} />,
    },
    {
      key: "total",
      header: "Creación → aprobación",
      widthClass: "min-w-44",
      render: (row) => <ReviewDuration {...segmentOf(row, "total")} timeZone={timeZone} />,
    },
    {
      key: "ready",
      header: "Listo para aprobar",
      widthClass: "min-w-40",
      render: (row) => readyLabel(row, timeZone),
    },
  ];
}

export function ReviewTimesTable({
  rows,
  timeZone,
}: Readonly<{ rows: readonly ReviewTimeRow[]; timeZone: string }>) {
  return (
    <StickyTable
      columns={columns(timeZone)}
      rows={rows}
      getRowKey={(row) => `${row.pullRequestId}-${row.reviewerId ?? "none"}`}
      tableClassName="min-w-[68rem]"
      rowClassName="border-b last:border-b-0"
      renderCard={(row) => <ReviewTimesRowCard row={row} timeZone={timeZone} />}
    />
  );
}
