"use client";

import { Info } from "lucide-react";
import { useEffect, useMemo } from "react";

import { CopilotErrorAlert } from "@/components/copilot/copilot-error-alert";
import { ReviewTimesSummary } from "@/components/reports/review-times/review-times-summary";
import { ReviewTimesTable } from "@/components/reports/review-times/review-times-table";
import { useReviewTimesUrl } from "@/components/reports/review-times/review-times-url-provider";
import { ReportsTimeLogEmptyState } from "@/components/reports/time-log/reports-time-log-empty-state";
import { NoticeBanner } from "@/components/shared/notice-banner";
import { distinctPeople } from "@/lib/review-times/person-options";
import { toLocalFilters } from "@/lib/review-times/search-params";
import { filterReviewTimeRows } from "@/lib/review-times/filter-rows";
import { reviewTimeAverages } from "@/lib/review-times/averages";
import type { ReviewTimeRow } from "@/lib/review-times/types";
import type { ReviewTimesSnapshot } from "@/lib/review-times/load-review-times";

const EMPTY_ROWS: readonly ReviewTimeRow[] = [];

export function ReviewTimesResults({
  report,
  error,
  timeZone,
  project,
}: Readonly<{
  report: ReviewTimesSnapshot | null;
  error: string | null;
  timeZone: string;
  project: string;
}>) {
  const { state, setPeople } = useReviewTimesUrl();
  const sourceRows = report?.rows ?? EMPTY_ROWS;
  const reviewerOptions = useMemo(
    () => distinctPeople(sourceRows, (row) => row.reviewerId, (row) => row.reviewerName),
    [sourceRows],
  );
  const authorOptions = useMemo(
    () => distinctPeople(sourceRows, (row) => row.authorId, (row) => row.authorName),
    [sourceRows],
  );

  useEffect(() => {
    setPeople({ reviewerOptions, authorOptions });
  }, [authorOptions, reviewerOptions, setPeople]);
  const rows = useMemo(
    () => filterReviewTimeRows(sourceRows, toLocalFilters(state)),
    [sourceRows, state],
  );
  const averages = useMemo(() => reviewTimeAverages(rows, timeZone), [rows, timeZone]);

  let emptyMessage = "No hay pull requests en este periodo.";
  if (sourceRows.length > 0 && rows.length === 0) {
    emptyMessage = "Ningún pull request coincide con los filtros.";
  }

  return (
    <div className="flex flex-col gap-4">
      {error ? <CopilotErrorAlert message={error} /> : null}
      {report?.truncated ? (
        <NoticeBanner icon={<Info className="mt-0.5 size-4 shrink-0" aria-hidden />}>
          <p>
            Este mes tiene más pull requests de los que se pueden leer de una vez. Se muestran
            hasta 200 por estado y repositorio.
          </p>
        </NoticeBanner>
      ) : null}
      {report ? <ReviewTimesSummary averages={averages} /> : null}
      {rows.length === 0 ? <ReportsTimeLogEmptyState message={emptyMessage} /> : null}
      {rows.length > 0 ? (
        <ReviewTimesTable
          rows={rows}
          timeZone={timeZone}
          organization={report?.organization ?? ""}
          project={project}
        />
      ) : null}
    </div>
  );
}
