import "server-only";

import { getScopedProjectAuth } from "@/lib/ado/get-scoped-project-auth";
import { resolveAdoProfile } from "@/lib/auth/resolve-ado-profile";
import { resolveGitRepositoryId } from "@/lib/azure-devops/git";
import {
  abandonAdoPullRequest,
  clearAdoPullRequestAutoComplete,
  getAdoPullRequest,
  getAdoPullRequestById,
  isSupportedPullRequestVote,
  reactivateAdoPullRequest,
  setAdoPullRequestVote,
} from "@/lib/azure-devops/pull-request-detail";
import { loadPullRequestDetail } from "@/lib/git/load-pull-request-detail";
import type {
  PullRequestDetail,
  PullRequestMutation,
} from "@/lib/pull-requests/detail-types";

export type UpdatePullRequestInput = {
  project: string;
  pullRequestId: number;
  repository?: string;
  mutation: PullRequestMutation;
};

async function resolveRepositoryId(
  auth: NonNullable<Awaited<ReturnType<typeof getScopedProjectAuth>>>,
  input: UpdatePullRequestInput,
): Promise<string> {
  if (input.repository?.trim()) {
    return resolveGitRepositoryId(auth, input.repository);
  }
  const raw = await getAdoPullRequestById(auth, input.pullRequestId);
  const repositoryId = raw.repository?.id?.trim();
  if (!repositoryId) {
    throw new Error("Azure DevOps no devolvió el repositorio del pull request.");
  }
  return repositoryId;
}

export async function updatePullRequest(
  input: UpdatePullRequestInput,
): Promise<PullRequestDetail> {
  const auth = await getScopedProjectAuth(input.project);
  if (!auth) {
    throw new Error("No hay conexión con Azure DevOps.");
  }

  const repositoryId = await resolveRepositoryId(auth, input);
  const current = await getAdoPullRequest(auth, repositoryId, input.pullRequestId);
  const repositoryName = current.repository?.name?.trim() || input.repository;

  switch (input.mutation.action) {
    case "vote": {
      if (!isSupportedPullRequestVote(input.mutation.vote)) {
        throw new Error("El voto indicado no es válido.");
      }
      const profile = await resolveAdoProfile(auth, { persist: true });
      if (!profile?.id) {
        throw new Error("No se pudo identificar tu usuario de Azure DevOps.");
      }
      await setAdoPullRequestVote(
        auth,
        repositoryId,
        input.pullRequestId,
        profile.id,
        input.mutation.vote,
      );
      break;
    }
    case "abandon":
      await abandonAdoPullRequest(auth, repositoryId, input.pullRequestId);
      break;
    case "reactivate":
      await reactivateAdoPullRequest(auth, repositoryId, input.pullRequestId);
      break;
    case "cancelAutoComplete":
      await clearAdoPullRequestAutoComplete(auth, repositoryId, input.pullRequestId);
      break;
  }

  return loadPullRequestDetail({
    project: input.project,
    pullRequestId: input.pullRequestId,
    repository: repositoryName,
  });
}
