"use client";

import { CopilotErrorAlert } from "@/components/copilot/copilot-error-alert";
import { PageHeader } from "@/components/layout/page-header";
import { ReviewTimesContent } from "@/components/reports/review-times/review-times-content";
import { NoticeBanner } from "@/components/shared/notice-banner";
import { PAGE_SEO } from "@/lib/seo/pages";
import { Info } from "lucide-react";

export type ReviewTimesPageShellProps = {
  project: string | null;
  repositories: readonly string[];
  initialMonthKey: string;
  timeZone: string;
  repositoryError: string | null;
  adoExecutionReady: boolean;
};

export function ReviewTimesPageShell({
  project,
  repositories,
  initialMonthKey,
  timeZone,
  repositoryError,
  adoExecutionReady,
}: Readonly<ReviewTimesPageShellProps>) {
  return (
    <div className="flex w-full flex-col gap-6 pb-6">
      <PageHeader
        title={PAGE_SEO.reportsReviewTimes.title}
        description={PAGE_SEO.reportsReviewTimes.description}
      />
      {repositoryError ? <CopilotErrorAlert message={repositoryError} /> : null}
      {adoExecutionReady && project ? (
        <ReviewTimesContent
          project={project}
          repositories={repositories}
          initialMonthKey={initialMonthKey}
          timeZone={timeZone}
        />
      ) : null}
      {adoExecutionReady && !project ? (
        <NoticeBanner icon={<Info className="mt-0.5 size-4 shrink-0" aria-hidden />}>
          <p>Selecciona un proyecto para ver los tiempos de revisión.</p>
        </NoticeBanner>
      ) : null}
    </div>
  );
}
