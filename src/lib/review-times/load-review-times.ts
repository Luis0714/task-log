import "server-only";

import { getScopedProjectAuth } from "@/lib/ado/get-scoped-project-auth";
import { mapWithConcurrency } from "@/lib/async/map-with-concurrency";
import { resolveAdoProfile } from "@/lib/auth/resolve-ado-profile";
import { listGitRepositories, type AdoGitRepositoryOption } from "@/lib/azure-devops/git";
import { listAdoPolicyEvaluations } from "@/lib/azure-devops/pull-request-detail";
import { listAdoPullRequestThreads } from "@/lib/azure-devops/pull-request-threads";
import {
  listAdoPullRequests,
  PULL_REQUEST_LIST_TOP,
  type AdoListedPullRequest,
  type AdoPullRequestLifecycle,
  type PullRequestCreatedWindow,
} from "@/lib/azure-devops/pull-requests";
import type { AdoCallerAuth } from "@/lib/azure-devops/resolve-auth";
import { resolveAdoTimeZone } from "@/lib/azure-devops/working-date-field";
import { buildReviewTimeRows } from "@/lib/review-times/build-review-time-rows";
import { mapPolicySignals, mapThreadSignals } from "@/lib/review-times/map-review-signals";
import { isCreatedInMonth, monthWindow, type MonthWindow } from "@/lib/review-times/month";
import type { ReviewTimePullRequest, ReviewTimeRow } from "@/lib/review-times/types";

const DETAIL_CONCURRENCY = 5;
const LIST_CONCURRENCY = 4;
const LISTED_STATUSES = ["active", "completed"] as const;

export type LoadReviewTimesInput = {
  project: string;
  monthKeys: readonly string[];
  repositories: readonly string[];
};

export type ReviewTimesSnapshot = {
  rows: ReviewTimeRow[];
  truncated: boolean;
  currentUserId: string | null;
  monthKeys: string[];
  organization: string;
};

type ListedPage = {
  items: AdoListedPullRequest[];
  truncated: boolean;
};

function chosenRepositories(
  available: readonly AdoGitRepositoryOption[],
  selected: readonly string[],
): AdoGitRepositoryOption[] {
  if (selected.length === 0) return [...available];
  const wanted = new Set(selected);
  return available.filter((repository) => wanted.has(repository.name));
}

function mapListedPullRequest(pullRequest: AdoListedPullRequest): ReviewTimePullRequest | null {
  const id = pullRequest.pullRequestId;
  const createdAt = pullRequest.creationDate?.trim();
  if (!id || !createdAt) return null;

  return {
    id,
    title: pullRequest.title?.trim() || `Pull request ${id}`,
    repository: pullRequest.repository?.name?.trim() || "Repositorio",
    authorId:
      pullRequest.createdBy?.id?.trim() ||
      pullRequest.createdBy?.displayName?.trim() ||
      "unknown",
    authorName: pullRequest.createdBy?.displayName?.trim() || "Autor",
    createdAt,
    isDraft: Boolean(pullRequest.isDraft),
    isCompleted: String(pullRequest.status ?? "").toLowerCase() === "completed" || String(pullRequest.status) === "3",
    reviewers: (pullRequest.reviewers ?? []).flatMap((reviewer) => {
      const reviewerId = reviewer.id?.trim() || reviewer.uniqueName?.trim();
      if (!reviewerId) return [];
      return [
        {
          id: reviewerId,
          displayName: reviewer.displayName?.trim() || "Revisor",
          isRequired: Boolean(reviewer.isRequired),
        },
      ];
    }),
  };
}

async function listStatusPage(
  auth: AdoCallerAuth,
  status: AdoPullRequestLifecycle,
  repositoryId: string,
  window: PullRequestCreatedWindow,
): Promise<ListedPage> {
  const items = await listAdoPullRequests(auth, status, repositoryId, window);
  return { items, truncated: items.length >= PULL_REQUEST_LIST_TOP };
}

function withRepositoryId(
  pullRequest: AdoListedPullRequest,
  repositoryId: string,
): AdoListedPullRequest {
  return {
    ...pullRequest,
    repository: {
      ...pullRequest.repository,
      id: pullRequest.repository?.id?.trim() || repositoryId,
    },
  };
}

async function listRepositoryMonths(
  auth: AdoCallerAuth,
  repositoryId: string,
  windows: readonly MonthWindow[],
): Promise<ListedPage> {
  const pages = await Promise.all(
    windows.map((window) => listRepositoryPullRequests(auth, repositoryId, window)),
  );
  return {
    items: pages.flatMap((page) => page.items),
    truncated: pages.some((page) => page.truncated),
  };
}

async function listRepositoryPullRequests(
  auth: AdoCallerAuth,
  repositoryId: string,
  window: MonthWindow,
): Promise<ListedPage> {
  const pages = await Promise.all(
    LISTED_STATUSES.map((status) =>
      listStatusPage(auth, status, repositoryId, {
        minTime: window.minTime,
        maxTime: window.maxTime,
      }),
    ),
  );
  return {
    items: pages.flatMap((page) =>
      page.items.map((item) => withRepositoryId(item, repositoryId)),
    ),
    truncated: pages.some((page) => page.truncated),
  };
}

function uniquePullRequests(items: readonly AdoListedPullRequest[]): AdoListedPullRequest[] {
  const byId = new Map<number, AdoListedPullRequest>();
  for (const item of items) {
    const id = item.pullRequestId;
    if (id) byId.set(id, item);
  }
  return [...byId.values()];
}

async function rowsForPullRequest(
  auth: AdoCallerAuth,
  pullRequest: AdoListedPullRequest,
): Promise<ReviewTimeRow[]> {
  const mapped = mapListedPullRequest(pullRequest);
  const repositoryId = pullRequest.repository?.id?.trim();
  const pullRequestId = pullRequest.pullRequestId;
  if (!mapped || !repositoryId || !pullRequestId) return [];

  const projectId = pullRequest.repository?.project?.id?.trim();
  const [threads, policies] = await Promise.all([
    listAdoPullRequestThreads(auth, repositoryId, pullRequestId).catch(() => []),
    projectId
      ? listAdoPolicyEvaluations(auth, projectId, pullRequestId)
      : Promise.resolve([]),
  ]);

  return buildReviewTimeRows({
    pullRequest: mapped,
    signals: mapThreadSignals(threads),
    policies: mapPolicySignals(policies),
  });
}

export async function loadReviewTimes(input: LoadReviewTimesInput): Promise<ReviewTimesSnapshot> {
  const auth = await getScopedProjectAuth(input.project);
  if (!auth) throw new Error("No hay conexión con Azure DevOps.");

  const timeZone = resolveAdoTimeZone();
  const windows = input.monthKeys
    .map((monthKey) => monthWindow(monthKey, timeZone))
    .filter((window): window is MonthWindow => window != null);
  if (windows.length === 0) throw new Error("Mes inválido.");

  const available = await listGitRepositories(auth);
  const repositories = chosenRepositories(available, input.repositories);
  const pages = await mapWithConcurrency(repositories, LIST_CONCURRENCY, (repository) =>
    listRepositoryMonths(auth, repository.id, windows),
  );
  const pullRequests = uniquePullRequests(pages.flatMap((page) => page.items)).filter((item) => {
    const createdAt = item.creationDate;
    if (!createdAt) return false;
    return windows.some((window) => isCreatedInMonth(createdAt, window));
  });
  const grouped = await mapWithConcurrency(pullRequests, DETAIL_CONCURRENCY, (pullRequest) =>
    rowsForPullRequest(auth, pullRequest),
  );
  const profile = await resolveAdoProfile(auth, { persist: true });

  return {
    rows: grouped.flat(),
    truncated: pages.some((page) => page.truncated),
    currentUserId: profile?.id ?? null,
    monthKeys: [...input.monthKeys],
    organization: auth.organization,
  };
}
