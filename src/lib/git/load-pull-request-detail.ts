import "server-only";

import { getScopedProjectAuth } from "@/lib/ado/get-scoped-project-auth";
import { resolveAdoProfile } from "@/lib/auth/resolve-ado-profile";
import { fetchUserStoriesByIds } from "@/lib/azure-devops/fetch-user-stories-by-ids";
import { resolveGitRepositoryId } from "@/lib/azure-devops/git";
import {
  getAdoPullRequest,
  getAdoPullRequestById,
  listAdoPolicyEvaluations,
  listAdoPullRequestConflicts,
  listAdoPullRequestIterationChanges,
  listAdoPullRequestIterations,
  listAdoPullRequestStatuses,
  listAdoPullRequestWorkItemIds,
  type AdoPullRequestRaw,
} from "@/lib/azure-devops/pull-request-detail";
import type { AdoCallerAuth } from "@/lib/azure-devops/resolve-auth";
import type { GitFileChange } from "@/lib/git/changeset";
import { isGitFilePath } from "@/lib/git/is-git-file-path";
import { mapAdoPullRequestDetail } from "@/lib/pull-requests/map-ado-pull-request-detail";
import type { PullRequestDetail } from "@/lib/pull-requests/detail-types";

export type LoadPullRequestDetailInput = {
  project: string;
  pullRequestId: number;
  repository?: string;
};

async function loadRawPullRequest(
  auth: AdoCallerAuth,
  input: LoadPullRequestDetailInput,
): Promise<AdoPullRequestRaw> {
  const repositoryName = input.repository?.trim();
  if (repositoryName) {
    const repositoryId = await resolveGitRepositoryId(auth, repositoryName);
    return getAdoPullRequest(auth, repositoryId, input.pullRequestId);
  }
  return getAdoPullRequestById(auth, input.pullRequestId);
}

export async function loadPullRequestDetail(
  input: LoadPullRequestDetailInput,
): Promise<PullRequestDetail> {
  const auth = await getScopedProjectAuth(input.project);
  if (!auth) {
    throw new Error("No hay conexión con Azure DevOps.");
  }

  const raw = await loadRawPullRequest(auth, input);
  const repositoryId = raw.repository?.id?.trim();
  if (!repositoryId || !raw.pullRequestId) {
    throw new Error("Azure DevOps no devolvió el pull request.");
  }

  const profile = await resolveAdoProfile(auth, { persist: true });
  const [iterations, statuses, policies, conflictedFiles, workItemIds] =
    await Promise.all([
      listAdoPullRequestIterations(auth, repositoryId, raw.pullRequestId),
      listAdoPullRequestStatuses(auth, repositoryId, raw.pullRequestId),
      raw.repository?.project?.id
        ? listAdoPolicyEvaluations(auth, raw.repository.project.id, raw.pullRequestId)
        : Promise.resolve([]),
      listAdoPullRequestConflicts(auth, repositoryId, raw.pullRequestId),
      listAdoPullRequestWorkItemIds(auth, repositoryId, raw.pullRequestId),
    ]);

  const linkedIds = [
    ...new Set([
      ...workItemIds,
      ...(raw.workItemRefs ?? [])
        .map((item) => Number.parseInt(item.id ?? "", 10))
        .filter((id) => Number.isFinite(id) && id > 0),
    ]),
  ];

  const lastIterationId = iterations.reduce(
    (max, iteration) => Math.max(max, iteration.id ?? 0),
    0,
  );
  const [workItems, iterationFiles] = await Promise.all([
    fetchUserStoriesByIds(auth, linkedIds),
    lastIterationId > 0
      ? listAdoPullRequestIterationChanges(
          auth,
          repositoryId,
          raw.pullRequestId,
          lastIterationId,
        )
      : Promise.resolve<GitFileChange[]>([]),
  ]);

  const files = iterationFiles.filter((file) => isGitFilePath(file.path));
  const mapped = mapAdoPullRequestDetail({
    raw,
    currentUserId: profile?.id ?? null,
    project: input.project,
    workItems,
    statuses,
    policies,
    conflictedFiles,
    files,
  });

  if (!mapped) {
    throw new Error("No se pudo interpretar el pull request.");
  }

  return mapped;
}
