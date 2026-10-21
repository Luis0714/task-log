"use client";

import { Info } from "lucide-react";
import type { ReactNode } from "react";

import { CopilotErrorAlert } from "@/components/copilot/copilot-error-alert";
import { PageHeader } from "@/components/layout/page-header";
import { ReviewTimesFiltersBar } from "@/components/reports/review-times/review-times-filters-bar";
import { ReviewTimesResultsSkeleton } from "@/components/reports/review-times/review-times-skeleton";
import { ReviewTimesUrlProvider, useReviewTimesUrl } from "@/components/reports/review-times/review-times-url-provider";
import { NoticeBanner } from "@/components/shared/notice-banner";
import { PAGE_SEO } from "@/lib/seo/pages";
import type { PersonOption } from "@/lib/review-times/person-options";

export type ReviewTimesPageShellProps = {
  project: string | null;
  repositories: readonly string[];
  timeZone: string;
  defaultRepository: string | null;
  currentUserId: string | null;
  repositoryError: string | null;
  adoExecutionReady: boolean;
  children: ReactNode;
};

function repositoryOptions(names: readonly string[]): PersonOption[] {
  return names.map((name) => ({ value: name, label: name }));
}

export function ReviewTimesPageShell({
  project,
  repositories,
  timeZone,
  defaultRepository,
  currentUserId,
  repositoryError,
  adoExecutionReady,
  children,
}: Readonly<ReviewTimesPageShellProps>) {
  return (
    <div className="flex w-full flex-col gap-6 pb-6">
      <PageHeader
        title={PAGE_SEO.reportsReviewTimes.title}
        description={PAGE_SEO.reportsReviewTimes.description}
      />
      {repositoryError ? <CopilotErrorAlert message={repositoryError} /> : null}
      {adoExecutionReady && project ? (
        <ReviewTimesUrlProvider
          timeZone={timeZone}
          defaultRepository={defaultRepository}
          knownRepositories={repositories}
        >
          <ReviewTimesFiltersBar
            repositoryOptions={repositoryOptions(repositories)}
            currentUserId={currentUserId}
          />
          <ReviewTimesReportSlot>{children}</ReviewTimesReportSlot>
        </ReviewTimesUrlProvider>
      ) : null}
      {adoExecutionReady && !project ? (
        <NoticeBanner icon={<Info className="mt-0.5 size-4 shrink-0" aria-hidden />}>
          <p>Selecciona un proyecto para ver los tiempos de revisión.</p>
        </NoticeBanner>
      ) : null}
    </div>
  );
}

function ReviewTimesReportSlot({ children }: Readonly<{ children: ReactNode }>) {
  const { isNavigating } = useReviewTimesUrl();
  if (isNavigating) return <ReviewTimesResultsSkeleton />;
  return children;
}
