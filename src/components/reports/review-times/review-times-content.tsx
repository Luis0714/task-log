"use client";

import { Info } from "lucide-react";
import { useMemo } from "react";

import { CopilotErrorAlert } from "@/components/copilot/copilot-error-alert";
import { ReviewTimesFiltersBar } from "@/components/reports/review-times/review-times-filters-bar";
import { ReviewTimesSummary } from "@/components/reports/review-times/review-times-summary";
import { ReviewTimesTable } from "@/components/reports/review-times/review-times-table";
import { ReportsTimeLogEmptyState } from "@/components/reports/time-log/reports-time-log-empty-state";
import { ReportsTimeLogStaleBanner } from "@/components/reports/time-log/reports-time-log-stale-banner";
import { NoticeBanner } from "@/components/shared/notice-banner";
import { useReviewTimesReport } from "@/hooks/reports/use-review-times-report";
import { distinctPeople, type PersonOption } from "@/lib/review-times/person-options";

export type ReviewTimesContentProps = {
  project: string;
  repositories: readonly string[];
  initialMonthKey: string;
  timeZone: string;
};

function repositoryOptions(names: readonly string[]): PersonOption[] {
  return names.map((name) => ({ value: name, label: name }));
}

export function ReviewTimesContent({
  project,
  repositories,
  initialMonthKey,
  timeZone,
}: Readonly<ReviewTimesContentProps>) {
  const report = useReviewTimesReport(project, initialMonthKey);
  const sourceRows = useMemo(() => report.report?.rows ?? [], [report.report]);
  const reviewerOptions = useMemo(
    () => distinctPeople(sourceRows, (row) => row.reviewerId, (row) => row.reviewerName),
    [sourceRows],
  );
  const authorOptions = useMemo(
    () => distinctPeople(sourceRows, (row) => row.authorId, (row) => row.authorName),
    [sourceRows],
  );

  let emptyMessage = "Selecciona el mes y genera el reporte.";
  if (report.hasGenerated && sourceRows.length === 0) {
    emptyMessage = "No hay pull requests en este mes.";
  } else if (report.hasGenerated && report.rows.length === 0) {
    emptyMessage = "Ningún pull request coincide con los filtros.";
  }

  return (
    <div className="flex flex-col gap-4">
      <ReviewTimesFiltersBar
        monthKey={report.monthKey}
        onMonthKeyChange={report.setMonthKey}
        repositories={report.repositories}
        repositoryOptions={repositoryOptions(repositories)}
        onRepositoriesChange={report.setRepositories}
        reviewerIds={report.filters.reviewerIds}
        reviewerOptions={reviewerOptions}
        onReviewerIdsChange={report.setReviewerIds}
        currentUserId={report.report?.currentUserId ?? null}
        authorIds={report.filters.authorIds}
        authorOptions={authorOptions}
        onAuthorIdsChange={report.setAuthorIds}
        statuses={report.filters.statuses}
        onStatusesChange={report.setStatuses}
        search={report.filters.search}
        onSearchChange={report.setSearch}
        onGenerate={() => void report.generate()}
        generating={report.loading}
        isStale={report.isStale}
      />
      {report.isStale ? <ReportsTimeLogStaleBanner /> : null}
      {report.error ? <CopilotErrorAlert message={report.error} /> : null}
      {report.report?.truncated ? (
        <NoticeBanner icon={<Info className="mt-0.5 size-4 shrink-0" aria-hidden />}>
          <p>
            Este mes tiene más pull requests de los que se pueden leer de una vez. Se muestran
            hasta 200 por estado y repositorio.
          </p>
        </NoticeBanner>
      ) : null}
      {report.hasGenerated ? <ReviewTimesSummary averages={report.averages} /> : null}
      {report.loading ? (
        <p className="text-muted-foreground text-sm">Calculando tiempos de revisión…</p>
      ) : null}
      {!report.loading && report.rows.length === 0 ? (
        <ReportsTimeLogEmptyState message={emptyMessage} />
      ) : null}
      {report.rows.length > 0 ? (
        <ReviewTimesTable rows={report.rows} timeZone={timeZone} />
      ) : null}
    </div>
  );
}
