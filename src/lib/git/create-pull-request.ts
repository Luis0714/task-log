import "server-only";

import { getScopedProjectAuth } from "@/lib/ado/get-scoped-project-auth";
import { resolveGitRepositoryId } from "@/lib/azure-devops/git";
import {
  createAdoPullRequest,
  enablePullRequestAutoComplete,
} from "@/lib/azure-devops/pull-requests";
import { resolveAdoProfile } from "@/lib/auth/resolve-ado-profile";
import { isEmptyRichText } from "@/lib/html/html-to-plain-text";
import type {
  CreatePullRequestBody,
  CreatePullRequestResponse,
} from "@/lib/schemas/git-pull-request";

function toReviewers(input: CreatePullRequestBody) {
  const required = new Set(input.requiredReviewers);
  return [
    ...input.requiredReviewers.map((id) => ({ id, isRequired: true })),
    ...input.optionalReviewers
      .filter((id) => !required.has(id))
      .map((id) => ({ id, isRequired: false })),
  ];
}

export async function createPullRequest(
  input: CreatePullRequestBody,
): Promise<CreatePullRequestResponse> {
  const auth = await getScopedProjectAuth(input.project);
  if (!auth) {
    throw new Error("No hay conexión con Azure DevOps.");
  }

  const repositoryId = await resolveGitRepositoryId(auth, input.repository);
  const created = await createAdoPullRequest(auth, {
    repositoryId,
    source: input.source,
    target: input.target,
    title: input.title,
    description: isEmptyRichText(input.description) ? "" : input.description,
    reviewers: toReviewers(input),
    workItemIds: input.linkedWorkItemIds,
    labels: input.tags,
  });

  let autoCompleteApplied = false;
  if (input.autoComplete) {
    const profile = await resolveAdoProfile(auth, { persist: true });
    if (profile?.id) {
      try {
        await enablePullRequestAutoComplete(
          auth,
          repositoryId,
          created.pullRequestId,
          profile.id,
        );
        autoCompleteApplied = true;
      } catch {
        autoCompleteApplied = false;
      }
    }
  }

  return {
    pullRequestId: created.pullRequestId,
    title: created.title,
    autoCompleteApplied,
  };
}
