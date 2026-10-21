"use client";

import { ReviewTimesColumnHint } from "@/components/reports/review-times/review-times-column-hint";
import {
  ApprovalDuration,
  FirstReviewDuration,
  ReviewDate,
} from "@/components/reports/review-times/review-duration";
import { firstReviewedAtByPullRequest } from "@/lib/review-times/averages";
import { ReviewTimesPullRequestLink } from "@/components/reports/review-times/review-times-pull-request-link";
import { ReviewTimesRowCard } from "@/components/reports/review-times/review-times-row-card";
import { StickyTable, type StickyTableColumn } from "@/components/ui/sticky-table";
import type { ReviewTimeRow } from "@/lib/review-times/types";

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
      headerClassName: "whitespace-normal",
      widthClass: "min-w-56",
      sticky: { leftClass: "left-0", isLast: true },
      bodyClassName: "whitespace-normal",
      render: (row) => (
        <div className="min-w-0">
          <ReviewTimesPullRequestLink
            organization={organization}
            project={project}
            repository={row.repository}
            pullRequestId={row.pullRequestId}
            title={row.title}
          />
          <p className="text-muted-foreground text-xs">
            {row.authorName}
            {row.isDraft ? " · Borrador" : ""} · {row.repository}
          </p>
        </div>
      ),
    },
    {
      key: "reviewer",
      header: (
        <ReviewTimesColumnHint
          label="Revisor"
          hint="Persona obligatoria del repositorio. Si no hay, se muestra —."
        />
      ),
      headerClassName: "whitespace-normal",
      widthClass: "min-w-36",
      bodyClassName: "whitespace-normal",
      render: (row) =>
        row.reviewerId ? (
          row.reviewerName
        ) : (
          <span className="text-muted-foreground">—</span>
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
      headerClassName: "whitespace-normal",
      widthClass: "min-w-36",
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
      headerClassName: "whitespace-normal",
      widthClass: "min-w-36",
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
      headerClassName: "whitespace-normal",
      widthClass: "min-w-44",
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
      headerClassName: "whitespace-normal",
      widthClass: "min-w-40",
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
      headerClassName: "whitespace-normal",
      widthClass: "min-w-40",
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
      tableClassName="min-w-[68rem]"
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
