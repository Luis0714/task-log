import type { UserStorySnapshot } from "@/lib/azure-devops/fetch-user-stories-by-ids";
import type {
  AdoPolicyEvaluation,
  AdoPullRequestRaw,
  AdoPullRequestStatus,
} from "@/lib/azure-devops/pull-request-detail";
import type { GitFileChange } from "@/lib/git/changeset";
import { buildDetailChecks } from "@/lib/pull-requests/build-detail-checks";
import type {
  PullRequestDetail,
  PullRequestDetailReviewer,
  PullRequestDetailWorkItem,
} from "@/lib/pull-requests/detail-types";
import { mapWorkItemKind } from "@/lib/pull-requests/map-work-item-kind";
import type { PullRequestLifecycleStatus, PullRequestVoteStatus } from "@/lib/pull-requests/types";
import {
  isApprovedVote,
  PULL_REQUEST_VOTE,
} from "@/lib/pull-requests/vote";

function normalizeBranch(value: string): string {
  return value.trim().replace(/^refs\/heads\//, "");
}

function mapLifecycle(status: string | number | undefined): PullRequestLifecycleStatus {
  const raw = String(status ?? "").toLowerCase();
  if (raw === "3" || raw === "completed") return "completed";
  if (raw === "2" || raw === "abandoned") return "abandoned";
  return "active";
}

function hasMergeConflicts(mergeStatus: string | number | undefined): boolean {
  const raw = String(mergeStatus ?? "").toLowerCase();
  return raw === "conflicts" || raw === "2";
}

function reviewGate(reviewers: readonly PullRequestDetailReviewer[]): PullRequestDetailReviewer[] {
  const required = reviewers.filter((reviewer) => reviewer.isRequired);
  return required.length > 0 ? required : [...reviewers];
}

function mapVoteStatus(
  isDraft: boolean,
  reviewers: readonly PullRequestDetailReviewer[],
): PullRequestVoteStatus {
  if (isDraft) return "draft";
  const votes = reviewers.map((reviewer) => reviewer.vote);
  if (votes.some((vote) => vote <= PULL_REQUEST_VOTE.rejected)) return "changes_requested";
  if (votes.some((vote) => vote === PULL_REQUEST_VOTE.waiting)) return "waiting";
  const gate = reviewGate(reviewers);
  if (gate.length > 0 && gate.every((reviewer) => isApprovedVote(reviewer.vote))) {
    return "approved";
  }
  return "needs_review";
}

function mapApprovalSummary(reviewers: readonly PullRequestDetailReviewer[]): string | null {
  const gate = reviewGate(reviewers);
  if (gate.length === 0) return null;
  const approved = gate.filter((reviewer) => isApprovedVote(reviewer.vote)).length;
  if (approved === 0) return null;
  return `Aprobado (${approved}/${gate.length})`;
}

function mapReviewers(raw: AdoPullRequestRaw): PullRequestDetailReviewer[] {
  return (raw.reviewers ?? [])
    .map((reviewer) => {
      const id = reviewer.id?.trim();
      if (!id) return null;
      return {
        id,
        displayName: reviewer.displayName?.trim() || "Revisor",
        isRequired: Boolean(reviewer.isRequired),
        vote: reviewer.vote ?? 0,
      };
    })
    .filter((reviewer): reviewer is PullRequestDetailReviewer => reviewer !== null);
}

function mapWorkItems(items: readonly UserStorySnapshot[]): PullRequestDetailWorkItem[] {
  return items.map((item) => ({
    id: item.id,
    title: item.title,
    type: item.type ?? "Work item",
    kind: mapWorkItemKind(item.type ?? ""),
    state: item.state,
  }));
}

function resolveCompare(
  raw: AdoPullRequestRaw,
  sourceBranch: string,
  targetBranch: string,
  lifecycleStatus: PullRequestLifecycleStatus,
): { source: string; target: string } {
  const sourceCommit = raw.lastMergeSourceCommit?.commitId?.trim();
  const targetCommit = raw.lastMergeTargetCommit?.commitId?.trim();
  if (lifecycleStatus !== "active" && sourceCommit && targetCommit) {
    return { source: sourceCommit, target: targetCommit };
  }
  return { source: sourceBranch, target: targetBranch };
}

export function mapAdoPullRequestDetail(input: {
  raw: AdoPullRequestRaw;
  currentUserId: string | null;
  project: string;
  workItems: readonly UserStorySnapshot[];
  statuses: readonly AdoPullRequestStatus[];
  policies: readonly AdoPolicyEvaluation[];
  conflictedFiles: readonly string[];
  files: readonly GitFileChange[];
}): PullRequestDetail | null {
  const id = input.raw.pullRequestId;
  if (!id) return null;

  const reviewers = mapReviewers(input.raw);
  const isDraft = Boolean(input.raw.isDraft);
  const lifecycleStatus = mapLifecycle(input.raw.status);
  const authorId = input.raw.createdBy?.id?.trim() ?? "";
  const sourceBranch = normalizeBranch(input.raw.sourceRefName ?? "");
  const targetBranch = normalizeBranch(input.raw.targetRefName ?? "");
  const myReviewer = reviewers.find((reviewer) => reviewer.id === input.currentUserId);
  const hasConflicts = hasMergeConflicts(input.raw.mergeStatus);

  return {
    id,
    title: input.raw.title?.trim() || "(sin título)",
    description: input.raw.description?.trim() ?? "",
    lifecycleStatus,
    voteStatus: mapVoteStatus(isDraft, reviewers),
    approvalSummary: mapApprovalSummary(reviewers),
    sourceBranch,
    targetBranch,
    repository: input.raw.repository?.name?.trim() || "—",
    project: input.raw.repository?.project?.name?.trim() || input.project,
    author: input.raw.createdBy?.displayName?.trim() || "Desconocido",
    createdAt: input.raw.creationDate || new Date().toISOString(),
    closedAt: input.raw.closedDate ?? null,
    closedBy: input.raw.closedBy?.displayName?.trim() ?? null,
    autoCompleteSetBy: input.raw.autoCompleteSetBy?.displayName?.trim() ?? null,
    hasConflicts,
    isDraft,
    isMine: Boolean(input.currentUserId && authorId === input.currentUserId),
    needsMyReview: Boolean(
      input.currentUserId &&
        !isDraft &&
        lifecycleStatus === "active" &&
        myReviewer &&
        myReviewer.vote === 0,
    ),
    myVote: myReviewer?.vote ?? 0,
    mergeCommitId: input.raw.lastMergeCommit?.commitId?.trim() ?? null,
    mergeCommitAuthor:
      input.raw.lastMergeCommit?.author?.name?.trim() ||
      input.raw.closedBy?.displayName?.trim() ||
      input.raw.createdBy?.displayName?.trim() ||
      null,
    mergeCommitDate:
      input.raw.lastMergeCommit?.author?.date ?? input.raw.closedDate ?? null,
    compare: resolveCompare(input.raw, sourceBranch, targetBranch, lifecycleStatus),
    reviewers,
    labels: (input.raw.labels ?? [])
      .map((label) => label.name?.trim() ?? "")
      .filter(Boolean),
    workItems: mapWorkItems(input.workItems),
    checks: buildDetailChecks({
      hasConflicts,
      lifecycleStatus,
      reviewers,
      statuses: input.statuses,
      policies: input.policies,
    }),
    conflictedFiles: [...input.conflictedFiles],
    files: [...input.files],
  };
}
