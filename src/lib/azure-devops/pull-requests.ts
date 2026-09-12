import "server-only";

import { adoFetch, adoOrgBase, adoProjectBase } from "@/lib/azure-devops/client";
import type { AdoCallerAuth } from "@/lib/azure-devops/resolve-auth";
import { adoListErrorMessage } from "@/lib/azure-devops/wiql";
import { normalizeGitBranchName } from "@/lib/azure-devops/git";

const API_VERSION = "7.1";

export type AdoPullRequestReviewer = {
  id: string;
  isRequired: boolean;
};

export type CreateAdoPullRequestInput = {
  repositoryId: string;
  source: string;
  target: string;
  title: string;
  description: string;
  reviewers: readonly AdoPullRequestReviewer[];
  workItemIds: readonly number[];
  labels: readonly string[];
};

export type CreatedAdoPullRequest = {
  pullRequestId: number;
  title: string;
};

type AdoPullRequest = {
  pullRequestId?: number;
  title?: string;
};

async function readAdoError(res: Response, fallback: string): Promise<string> {
  const body = await res.text();
  try {
    const parsed = JSON.parse(body) as { message?: string };
    const message = parsed.message?.trim();
    if (message) return message;
  } catch {
    /* cuerpo no JSON */
  }
  return adoListErrorMessage(res, body, fallback);
}

function toHeadsRef(branch: string): string {
  const name = normalizeGitBranchName(branch);
  return name.startsWith("refs/heads/") ? name : `refs/heads/${name}`;
}

function uniqueReviewers(
  reviewers: readonly AdoPullRequestReviewer[],
): AdoPullRequestReviewer[] {
  const byId = new Map<string, AdoPullRequestReviewer>();
  for (const reviewer of reviewers) {
    const current = byId.get(reviewer.id);
    if (!current || reviewer.isRequired) {
      byId.set(reviewer.id, reviewer);
    }
  }
  return [...byId.values()];
}

export async function createAdoPullRequest(
  auth: AdoCallerAuth,
  input: CreateAdoPullRequestInput,
): Promise<CreatedAdoPullRequest> {
  const reviewers = uniqueReviewers(input.reviewers);
  const url = `${adoProjectBase(auth)}/_apis/git/repositories/${encodeURIComponent(input.repositoryId)}/pullrequests?api-version=${API_VERSION}`;
  const res = await adoFetch(auth, url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sourceRefName: toHeadsRef(input.source),
      targetRefName: toHeadsRef(input.target),
      title: input.title,
      description: input.description,
      ...(reviewers.length > 0 ? { reviewers } : {}),
      ...(input.workItemIds.length > 0
        ? {
            workItemRefs: input.workItemIds.map((id) => ({
              id: String(id),
              url: `${adoOrgBase(auth)}/_apis/wit/workItems/${id}`,
            })),
          }
        : {}),
      ...(input.labels.length > 0
        ? { labels: input.labels.map((name) => ({ name })) }
        : {}),
    }),
  });

  if (!res.ok) {
    throw new Error(await readAdoError(res, "No se pudo crear el pull request."));
  }

  const payload = (await res.json()) as AdoPullRequest;
  if (!payload.pullRequestId) {
    throw new Error("Azure DevOps no devolvió el identificador del pull request.");
  }

  return {
    pullRequestId: payload.pullRequestId,
    title: payload.title?.trim() || input.title,
  };
}

export async function enablePullRequestAutoComplete(
  auth: AdoCallerAuth,
  repositoryId: string,
  pullRequestId: number,
  userId: string,
): Promise<void> {
  const url = `${adoProjectBase(auth)}/_apis/git/repositories/${encodeURIComponent(repositoryId)}/pullrequests/${pullRequestId}?api-version=${API_VERSION}`;
  const res = await adoFetch(auth, url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      autoCompleteSetBy: { id: userId },
      completionOptions: {
        mergeStrategy: "noFastForward",
        deleteSourceBranch: false,
      },
    }),
  });

  if (!res.ok) {
    throw new Error(await readAdoError(res, "No se pudo activar el autocompletado."));
  }
}
