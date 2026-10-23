import { Suspense } from "react";
import { redirect } from "next/navigation";

import { listOrganizationProjectsCached, resolveAdoCatalogCacheScope } from "@/lib/ado/ado-catalog-cache";
import { loadSessionDefaultRepository } from "@/lib/ado/load-session-default-repository";
import { requireAdoCaller } from "@/lib/ado/require-ado-caller";
import { readCachedAdoProfile } from "@/lib/auth/ado-profile-session";
import type { AdoProject } from "@/lib/azure-devops/projects";
import { resolveAdoTimeZone } from "@/lib/azure-devops/working-date-field";
import { loadGitRepositories } from "@/lib/git/load-git-repositories";
import { ReviewTimesPageShell } from "@/components/reports/review-times/review-times-page-shell";
import { ReviewTimesReportServer } from "@/components/reports/review-times/review-times-report-server";
import { ReviewTimesResultsSkeleton } from "@/components/reports/review-times/review-times-skeleton";
import { pickProject } from "@/lib/time-log/context-defaults";
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
  const canQuery = adoExecutionReady;
  const visibleProjects = await loadVisibleProjects(canQuery);
  const requestedProject = firstSearchParam(searchParams.project);
  const project = resolveReportProject(requestedProject, visibleProjects.projects, defaultProject);
  const [loaded, defaultRepository, profile] = await Promise.all([
    loadRepositoryNames(canQuery, project),
    canQuery ? loadSessionDefaultRepository() : Promise.resolve(null),
    canQuery ? readCachedAdoProfile() : Promise.resolve(null),
  ]);
  const parsed = parseReviewTimesSearchParams(searchParams, {
    timeZone,
    defaultRepository,
    knownRepositories: loaded.repositories,
  });
  const projectMatches = !project || requestedProject === project;

  if (canQuery && (!parsed.isCanonical || !projectMatches)) {
    const params = applyReviewTimesSearchParams(recordToSearchParams(searchParams), parsed.state);
    if (project) params.set("project", project);
    redirect(reviewTimesHref(params));
  }

  const reportKey = `${project}|${parsed.state.monthKeys.join(",")}|${parsed.state.allRepositories ? "*" : parsed.state.repositories.join("|")}`;

  return (
    <ReviewTimesPageShell
      project={project || null}
      projects={visibleProjects.projects}
      repositories={loaded.repositories}
      timeZone={timeZone}
      defaultRepository={defaultRepository}
      currentUserId={profile?.id ?? null}
      repositoryError={visibleProjects.error ?? loaded.error}
      adoExecutionReady={adoExecutionReady}
    >
      {canQuery && project ? (
        <Suspense key={reportKey} fallback={<ReviewTimesResultsSkeleton />}>
          <ReviewTimesReportServer
            project={project}
            monthKeys={parsed.state.monthKeys}
            repositories={parsed.state.allRepositories ? [] : parsed.state.repositories}
            timeZone={timeZone}
          />
        </Suspense>
      ) : null}
    </ReviewTimesPageShell>
  );
}

function firstSearchParam(value: string | string[] | undefined): string {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw?.trim() ?? "";
}

function resolveReportProject(
  requested: string,
  projects: readonly AdoProject[],
  defaultProject: string | null,
): string {
  if (projects.length === 0) return requested || defaultProject?.trim() || "";
  return pickProject(requested, [...projects], defaultProject);
}

async function loadVisibleProjects(
  canQuery: boolean,
): Promise<{ projects: AdoProject[]; error: string | null }> {
  if (!canQuery) return { projects: [], error: null };
  const caller = await requireAdoCaller();
  if (!caller.ok) return { projects: [], error: null };
  try {
    const scope = await resolveAdoCatalogCacheScope(caller.auth);
    return { projects: await listOrganizationProjectsCached(caller.auth, scope), error: null };
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "No se pudieron cargar los proyectos.";
    return { projects: [], error: message };
  }
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
