import "server-only";

import { adoFetch, adoProjectBase } from "@/lib/azure-devops/client";
import type { AdoCallerAuth } from "@/lib/azure-devops/resolve-auth";
import { adoListErrorMessage } from "@/lib/azure-devops/wiql";
import type { GitFileChange } from "@/lib/git/changeset";
import { isGitFilePath } from "@/lib/git/is-git-file-path";
import { PULL_REQUEST_VOTE } from "@/lib/pull-requests/vote";

const API_VERSION = "7.1";
const CHANGES_TOP = 500;

export type AdoPullRequestIdentity = {
  id?: string;
  displayName?: string;
};

export type AdoPullRequestReviewer = AdoPullRequestIdentity & {
  vote?: number;
  isRequired?: boolean;
};

export type AdoPullRequestCommitRef = {
  commitId?: string;
  author?: { name?: string; date?: string };
  comment?: string;
};

export type AdoPullRequestRaw = {
  pullRequestId?: number;
  title?: string;
  description?: string;
  status?: string | number;
  isDraft?: boolean;
  creationDate?: string;
  closedDate?: string;
  createdBy?: AdoPullRequestIdentity;
  closedBy?: AdoPullRequestIdentity;
  reviewers?: AdoPullRequestReviewer[];
  sourceRefName?: string;
  targetRefName?: string;
  mergeStatus?: string | number;
  mergeFailureMessage?: string;
  autoCompleteSetBy?: AdoPullRequestIdentity;
  lastMergeSourceCommit?: AdoPullRequestCommitRef;
  lastMergeTargetCommit?: AdoPullRequestCommitRef;
  lastMergeCommit?: AdoPullRequestCommitRef;
  labels?: Array<{ name?: string }>;
  workItemRefs?: Array<{ id?: string }>;
  repository?: {
    id?: string;
    name?: string;
    project?: { id?: string; name?: string };
  };
};

export type AdoPullRequestIteration = {
  id?: number;
  description?: string;
  author?: AdoPullRequestIdentity;
  createdDate?: string;
};

export type AdoPullRequestStatus = {
  id?: number;
  state?: string;
  description?: string;
  context?: { name?: string; genre?: string };
};

export type AdoPolicyEvaluation = {
  evaluationId?: string;
  status?: string;
  configuration?: {
    displayName?: string;
    isEnabled?: boolean;
    type?: { displayName?: string };
  };
};

export type AdoPullRequestConflict = {
  conflictPath?: string;
};

type AdoGitChange = {
  changeType?: string | number;
  item?: { path?: string; isFolder?: boolean; gitObjectType?: string };
  sourceServerItem?: string;
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

function repositoryBase(auth: AdoCallerAuth, repositoryId: string): string {
  return `${adoProjectBase(auth)}/_apis/git/repositories/${encodeURIComponent(repositoryId)}`;
}

export async function getAdoPullRequestById(
  auth: AdoCallerAuth,
  pullRequestId: number,
): Promise<AdoPullRequestRaw> {
  const url = `${adoProjectBase(auth)}/_apis/git/pullrequests/${pullRequestId}?api-version=${API_VERSION}`;
  const res = await adoFetch(auth, url);
  if (!res.ok) {
    throw new Error(await readAdoError(res, "No se pudo cargar el pull request."));
  }
  return (await res.json()) as AdoPullRequestRaw;
}

export async function getAdoPullRequest(
  auth: AdoCallerAuth,
  repositoryId: string,
  pullRequestId: number,
): Promise<AdoPullRequestRaw> {
  const url = `${repositoryBase(auth, repositoryId)}/pullrequests/${pullRequestId}?includeWorkItemRefs=true&api-version=${API_VERSION}`;
  const res = await adoFetch(auth, url);
  if (!res.ok) {
    throw new Error(await readAdoError(res, "No se pudo cargar el pull request."));
  }
  return (await res.json()) as AdoPullRequestRaw;
}

export async function listAdoPullRequestWorkItemIds(
  auth: AdoCallerAuth,
  repositoryId: string,
  pullRequestId: number,
): Promise<number[]> {
  const url = `${repositoryBase(auth, repositoryId)}/pullrequests/${pullRequestId}/workitems?api-version=${API_VERSION}`;
  const res = await adoFetch(auth, url);
  if (!res.ok) return [];
  const payload = (await res.json()) as { value?: Array<{ id?: string }> };
  return (payload.value ?? [])
    .map((item) => Number.parseInt(item.id ?? "", 10))
    .filter((id) => Number.isFinite(id) && id > 0);
}

export async function listAdoPullRequestIterations(
  auth: AdoCallerAuth,
  repositoryId: string,
  pullRequestId: number,
): Promise<AdoPullRequestIteration[]> {
  const url = `${repositoryBase(auth, repositoryId)}/pullrequests/${pullRequestId}/iterations?api-version=${API_VERSION}`;
  const res = await adoFetch(auth, url);
  if (!res.ok) return [];
  const payload = (await res.json()) as { value?: AdoPullRequestIteration[] };
  return payload.value ?? [];
}

export async function listAdoPullRequestConflicts(
  auth: AdoCallerAuth,
  repositoryId: string,
  pullRequestId: number,
): Promise<string[]> {
  const url = `${repositoryBase(auth, repositoryId)}/pullrequests/${pullRequestId}/conflicts?api-version=${API_VERSION}`;
  const res = await adoFetch(auth, url);
  if (!res.ok) return [];
  const payload = (await res.json()) as { value?: AdoPullRequestConflict[] };
  return (payload.value ?? [])
    .map((item) => item.conflictPath?.replace(/^\//, "").trim() ?? "")
    .filter((path) => path && isGitFilePath(path));
}

export async function listAdoPullRequestStatuses(
  auth: AdoCallerAuth,
  repositoryId: string,
  pullRequestId: number,
): Promise<AdoPullRequestStatus[]> {
  const url = `${repositoryBase(auth, repositoryId)}/pullrequests/${pullRequestId}/statuses?api-version=${API_VERSION}`;
  const res = await adoFetch(auth, url);
  if (!res.ok) return [];
  const payload = (await res.json()) as { value?: AdoPullRequestStatus[] };
  return payload.value ?? [];
}

export async function listAdoPolicyEvaluations(
  auth: AdoCallerAuth,
  projectId: string,
  pullRequestId: number,
): Promise<AdoPolicyEvaluation[]> {
  const artifactId = `vstfs:///CodeReview/CodeReviewId/${projectId}/${pullRequestId}`;
  const query = new URLSearchParams({
    artifactId,
    "api-version": "7.1-preview.1",
  });
  const url = `${adoProjectBase(auth)}/_apis/policy/evaluations?${query}`;
  const res = await adoFetch(auth, url);
  if (!res.ok) return [];
  const payload = (await res.json()) as { value?: AdoPolicyEvaluation[] };
  return (payload.value ?? []).filter((item) => item.configuration?.isEnabled !== false);
}

export async function listAdoPullRequestIterationChanges(
  auth: AdoCallerAuth,
  repositoryId: string,
  pullRequestId: number,
  iterationId: number,
): Promise<GitFileChange[]> {
  const query = new URLSearchParams({
    $top: String(CHANGES_TOP),
    "api-version": API_VERSION,
  });
  const url = `${repositoryBase(auth, repositoryId)}/pullrequests/${pullRequestId}/iterations/${iterationId}/changes?${query}`;
  const res = await adoFetch(auth, url);
  if (!res.ok) return [];
  const payload = (await res.json()) as {
    changeEntries?: AdoGitChange[];
    changes?: AdoGitChange[];
  };
  const seen = new Set<string>();
  const files: GitFileChange[] = [];

  for (const change of payload.changeEntries ?? payload.changes ?? []) {
    const item = change.item;
    if (item?.isFolder || item?.gitObjectType === "tree") continue;
    const path = (item?.path ?? change.sourceServerItem ?? "").replace(/^\//, "").trim();
    if (!path || !isGitFilePath(path) || seen.has(path)) continue;
    seen.add(path);
    files.push({
      path,
      kind: mapChangeKind(change.changeType),
      additions: 0,
      deletions: 0,
      hunks: [],
    });
  }

  return files;
}

function mapChangeKind(changeType: string | number | undefined): GitFileChange["kind"] {
  const raw = String(changeType ?? "").toLowerCase();
  if (raw.includes("add") || raw === "1") return "added";
  if (raw.includes("delete") || raw === "16") return "deleted";
  return "modified";
}

export async function setAdoPullRequestVote(
  auth: AdoCallerAuth,
  repositoryId: string,
  pullRequestId: number,
  reviewerId: string,
  vote: number,
): Promise<void> {
  const url = `${repositoryBase(auth, repositoryId)}/pullrequests/${pullRequestId}/reviewers/${encodeURIComponent(reviewerId)}?api-version=${API_VERSION}`;
  const res = await adoFetch(auth, url, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: reviewerId, vote }),
  });
  if (!res.ok) {
    throw new Error(await readAdoError(res, "No se pudo registrar el voto."));
  }
}

export async function patchAdoPullRequest(
  auth: AdoCallerAuth,
  repositoryId: string,
  pullRequestId: number,
  body: Record<string, unknown>,
): Promise<void> {
  const url = `${repositoryBase(auth, repositoryId)}/pullrequests/${pullRequestId}?api-version=${API_VERSION}`;
  const res = await adoFetch(auth, url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(await readAdoError(res, "No se pudo actualizar el pull request."));
  }
}

export async function abandonAdoPullRequest(
  auth: AdoCallerAuth,
  repositoryId: string,
  pullRequestId: number,
): Promise<void> {
  await patchAdoPullRequest(auth, repositoryId, pullRequestId, { status: "abandoned" });
}

export async function reactivateAdoPullRequest(
  auth: AdoCallerAuth,
  repositoryId: string,
  pullRequestId: number,
): Promise<void> {
  await patchAdoPullRequest(auth, repositoryId, pullRequestId, { status: "active" });
}

export async function clearAdoPullRequestAutoComplete(
  auth: AdoCallerAuth,
  repositoryId: string,
  pullRequestId: number,
): Promise<void> {
  await patchAdoPullRequest(auth, repositoryId, pullRequestId, {
    autoCompleteSetBy: null,
  });
}

export function isSupportedPullRequestVote(vote: number): boolean {
  return (
    vote === PULL_REQUEST_VOTE.approved ||
    vote === PULL_REQUEST_VOTE.approvedWithSuggestions ||
    vote === PULL_REQUEST_VOTE.none ||
    vote === PULL_REQUEST_VOTE.waiting ||
    vote === PULL_REQUEST_VOTE.rejected
  );
}
