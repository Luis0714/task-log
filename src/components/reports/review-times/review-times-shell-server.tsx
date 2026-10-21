import { Suspense } from "react";
import { redirect } from "next/navigation";

import { readCachedAdoProfile } from "@/lib/auth/ado-profile-session";
import { loadSessionDefaultRepository } from "@/lib/ado/load-session-default-repository";
import { resolveAdoTimeZone } from "@/lib/azure-devops/working-date-field";
import { loadGitRepositories } from "@/lib/git/load-git-repositories";
import { ReviewTimesPageShell } from "@/components/reports/review-times/review-times-page-shell";
import { ReviewTimesReportServer } from "@/components/reports/review-times/review-times-report-server";
import { ReviewTimesResultsSkeleton } from "@/components/reports/review-times/review-times-skeleton";
import {
  applyReviewTimesSearchParams,
  parseReviewTimesSearchParams,
  recordToSearchParams,
  reviewTimesHref,
} from "@/lib/review-times/search-params";

export type ReviewTimesShellServerProps = Readonly<{
  searchParams: Record<string, string | string[] | undefined>;
  defaultProject: string | null;
  adoExecutionReady: boolean;
}>;

export async function ReviewTimesShellServer({
  searchParams,
  defaultProject,
  adoExecutionReady,
}: ReviewTimesShellServerProps) {
  const timeZone = resolveAdoTimeZone();
  const canQuery = adoExecutionReady && Boolean(defaultProject);
  const [loaded, defaultRepository, profile] = await Promise.all([
    loadRepositoryNames(canQuery, defaultProject),
    canQuery ? loadSessionDefaultRepository() : Promise.resolve(null),
    canQuery ? readCachedAdoProfile() : Promise.resolve(null),
  ]);
  const parsed = parseReviewTimesSearchParams(searchParams, {
    timeZone,
    defaultRepository,
    knownRepositories: loaded.repositories,
  });

  if (canQuery && !parsed.isCanonical) {
    const params = applyReviewTimesSearchParams(recordToSearchParams(searchParams), parsed.state);
    redirect(reviewTimesHref(params));
  }

  const reportKey = `${parsed.state.monthKeys.join(",")}|${parsed.state.allRepositories ? "*" : parsed.state.repositories.join("|")}`;

  return (
    <ReviewTimesPageShell
      project={defaultProject}
      repositories={loaded.repositories}
      timeZone={timeZone}
      defaultRepository={defaultRepository}
      currentUserId={profile?.id ?? null}
      repositoryError={loaded.error}
      adoExecutionReady={adoExecutionReady}
    >
      {canQuery && defaultProject ? (
        <Suspense key={reportKey} fallback={<ReviewTimesResultsSkeleton />}>
          <ReviewTimesReportServer
            project={defaultProject}
            monthKeys={parsed.state.monthKeys}
            repositories={parsed.state.allRepositories ? [] : parsed.state.repositories}
            timeZone={timeZone}
          />
        </Suspense>
      ) : null}
    </ReviewTimesPageShell>
  );
}

async function loadRepositoryNames(
  canQuery: boolean,
  project: string | null,
): Promise<{ repositories: string[]; error: string | null }> {
  if (!canQuery || !project) return { repositories: [], error: null };
  try {
    return { repositories: await loadGitRepositories(project), error: null };
  } catch (cause) {
    const message =
      cause instanceof Error ? cause.message : "No se pudieron cargar los repositorios.";
    return { repositories: [], error: message };
  }
}
