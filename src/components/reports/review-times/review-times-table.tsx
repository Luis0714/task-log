"use client";

import { ReviewTimesColumnHint } from "@/components/reports/review-times/review-times-column-hint";
import {
  ApprovalDuration,
  FirstReviewDuration,
  ReviewDate,
} from "@/components/reports/review-times/review-duration";
import { firstReviewedAtByPullRequest } from "@/lib/review-times/averages";
import { ReviewTimesPullRequestLink } from "@/components/reports/review-times/review-times-pull-request-link";
import { ReviewTimesReviewerLine } from "@/components/reports/review-times/review-times-reviewer-line";
import { ReviewTimesRowCard } from "@/components/reports/review-times/review-times-row-card";
import { StickyTable, type StickyTableColumn } from "@/components/ui/sticky-table";
import { TruncatedTextTooltip } from "@/components/ui/truncated-text-tooltip";
import type { ReviewTimeRow } from "@/lib/review-times/types";

const HEADER_CELL = "overflow-hidden px-4 align-top whitespace-normal";
const BODY_CELL = "overflow-hidden px-4 align-top";

function pullRequestMeta(row: ReviewTimeRow): string {
  const draft = row.isDraft ? " · Borrador" : "";
  return `${row.authorName}${draft} · ${row.repository}`;
}

function columns(
  timeZone: string,
  organization: string,
  project: string,
  firstReviewByPullRequest: ReadonlyMap<number, string>,
): StickyTableColumn<ReviewTimeRow>[] {
  return [
    {
      key: "pullRequest",
      header: (
        <ReviewTimesColumnHint
          label="Pull request"
          hint="Título del cambio. El enlace abre el pull request en Azure DevOps."
        />
      ),
      headerClassName: HEADER_CELL,
      widthClass: "w-80 max-w-80",
      sticky: { leftClass: "left-0", isLast: true },
      bodyClassName: BODY_CELL,
      render: (row) => (
        <div className="min-w-0">
          <ReviewTimesPullRequestLink
            organization={organization}
            project={project}
            repository={row.repository}
            pullRequestId={row.pullRequestId}
            title={row.title}
            truncate
          />
          <TruncatedTextTooltip
            text={pullRequestMeta(row)}
            className="text-muted-foreground text-xs font-normal"
          />
          <ReviewTimesReviewerLine name={row.reviewerName} />
        </div>
      ),
    },
    {
      key: "created",
      header: (
        <ReviewTimesColumnHint
          label="Fecha de creación"
          hint="Momento en que se abrió el pull request."
        />
      ),
      headerClassName: HEADER_CELL,
      widthClass: "w-52 max-w-52",
      bodyClassName: BODY_CELL,
      render: (row) => <ReviewDate iso={row.createdAt} timeZone={timeZone} />,
    },
    {
      key: "reviewed",
      header: (
        <ReviewTimesColumnHint
          label="Fecha de revisión"
          hint="Primer comentario o voto del revisor obligatorio."
        />
      ),
      headerClassName: HEADER_CELL,
      widthClass: "w-52 max-w-52",
      bodyClassName: BODY_CELL,
      render: (row) => <ReviewDate iso={row.reviewedAt} timeZone={timeZone} />,
    },
    {
      key: "firstReview",
      header: (
        <ReviewTimesColumnHint
          label="Tiempo hasta primera revisión"
          hint="Tiempo de jornada desde la creación hasta la primera revisión del pull request. El promedio cuenta este valor una vez por pull request."
        />
      ),
      headerClassName: HEADER_CELL,
      widthClass: "w-52 max-w-52",
      bodyClassName: BODY_CELL,
      render: (row) => (
        <FirstReviewDuration
          row={row}
          firstReviewedAt={firstReviewByPullRequest.get(row.pullRequestId) ?? null}
          timeZone={timeZone}
        />
      ),
    },
    {
      key: "approved",
      header: (
        <ReviewTimesColumnHint
          label="Fecha de aprobación"
          hint="Primera vez que el revisor obligatorio aprobó, o aprobó con sugerencias."
        />
      ),
      headerClassName: HEADER_CELL,
      widthClass: "w-52 max-w-52",
      bodyClassName: BODY_CELL,
      render: (row) => <ReviewDate iso={row.approvedAt} timeZone={timeZone} />,
    },
    {
      key: "duration",
      header: (
        <ReviewTimesColumnHint
          label="Duración hasta aprobación"
          hint="Tiempo de lunes a viernes, de 8:00 a 17:00, desde la creación hasta la aprobación. Si se completó sin revisor, es 0 min."
        />
      ),
      headerClassName: HEADER_CELL,
      widthClass: "w-52 max-w-52",
      bodyClassName: BODY_CELL,
      render: (row) => <ApprovalDuration row={row} timeZone={timeZone} />,
    },
  ];
}

export function ReviewTimesTable({
  rows,
  timeZone,
  organization,
  project,
}: Readonly<{
  rows: readonly ReviewTimeRow[];
  timeZone: string;
  organization: string;
  project: string;
}>) {
  const firstReviewByPullRequest = firstReviewedAtByPullRequest(rows);
  return (
    <StickyTable
      columns={columns(timeZone, organization, project, firstReviewByPullRequest)}
      rows={rows}
      getRowKey={(row) => `${row.pullRequestId}-${row.reviewerId ?? "none"}`}
      tableClassName="min-w-[85rem]"
      rowClassName="border-b last:border-b-0"
      renderCard={(row) => (
        <ReviewTimesRowCard
          row={row}
          timeZone={timeZone}
          organization={organization}
          project={project}
          firstReviewedAt={firstReviewByPullRequest.get(row.pullRequestId) ?? null}
        />
      )}
    />
  );
}
