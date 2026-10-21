"use client";

import { ReviewTimesColumnHint } from "@/components/reports/review-times/review-times-column-hint";
import {
  ApprovalDuration,
  FirstReviewDuration,
  ReviewDate,
} from "@/components/reports/review-times/review-duration";
import { ReviewTimesPullRequestLink } from "@/components/reports/review-times/review-times-pull-request-link";
import { ReviewTimesReviewerLine } from "@/components/reports/review-times/review-times-reviewer-line";
import type { ReviewTimeRow } from "@/lib/review-times/types";

export function ReviewTimesRowCard({
  row,
  timeZone,
  organization,
  project,
  firstReviewedAt,
}: Readonly<{
  row: ReviewTimeRow;
  timeZone: string;
  organization: string;
  project: string;
  firstReviewedAt: string | null;
}>) {
  return (
    <article className="flex flex-col gap-3">
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
        <ReviewTimesReviewerLine name={row.reviewerName} />
      </div>
      <dl className="flex flex-col gap-1.5 text-sm">
        <DateLine
          label="Fecha de creación"
          hint="Momento en que se abrió el pull request."
          iso={row.createdAt}
          timeZone={timeZone}
        />
        <DateLine
          label="Fecha de revisión"
          hint="Primer comentario o voto del revisor obligatorio."
          iso={row.reviewedAt}
          timeZone={timeZone}
        />
        <div className="flex items-start justify-between gap-3">
          <dt className="min-w-0">
            <ReviewTimesColumnHint
              label="Tiempo hasta primera revisión"
              hint="Tiempo de jornada desde la creación hasta la primera revisión del pull request. El promedio cuenta este valor una vez por pull request."
            />
          </dt>
          <dd>
            <FirstReviewDuration
              row={row}
              firstReviewedAt={firstReviewedAt}
              timeZone={timeZone}
            />
          </dd>
        </div>
        <DateLine
          label="Fecha de aprobación"
          hint="Primera vez que el revisor obligatorio aprobó, o aprobó con sugerencias."
          iso={row.approvedAt}
          timeZone={timeZone}
        />
        <div className="flex items-start justify-between gap-3">
          <dt className="min-w-0">
            <ReviewTimesColumnHint
              label="Duración hasta aprobación"
              hint="Tiempo de lunes a viernes, de 8:00 a 17:00, desde la creación hasta la aprobación. Si se completó sin revisor, es 0 min."
            />
          </dt>
          <dd>
            <ApprovalDuration row={row} timeZone={timeZone} />
          </dd>
        </div>
      </dl>
    </article>
  );
}

function DateLine({
  label,
  hint,
  iso,
  timeZone,
}: Readonly<{ label: string; hint: string; iso: string | null; timeZone: string }>) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="min-w-0">
        <ReviewTimesColumnHint label={label} hint={hint} />
      </dt>
      <dd>
        <ReviewDate iso={iso} timeZone={timeZone} />
      </dd>
    </div>
  );
}
