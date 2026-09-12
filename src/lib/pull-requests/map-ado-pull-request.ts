import type { AdoListedPullRequest, AdoListedReviewer } from "@/lib/azure-devops/pull-requests";
import type {
  PullRequestLifecycleStatus,
  PullRequestListItem,
  PullRequestVoteStatus,
} from "@/lib/pull-requests/types";

const VOTE_APPROVED_WITH_SUGGESTIONS = 5;
const VOTE_WAITING = -5;
const VOTE_REJECTED = -10;

function normalizeBranch(value: string): string {
  return value.trim().replace(/^refs\/heads\//, "");
}

function mapLifecycle(status: string | number | undefined): PullRequestLifecycleStatus {
  const raw = String(status ?? "").toLowerCase();
  if (raw === "3" || raw === "completed") return "completed";
  if (raw === "2" || raw === "abandoned") return "abandoned";
  return "active";
}

function isApproved(vote: number): boolean {
  return vote >= VOTE_APPROVED_WITH_SUGGESTIONS;
}

function reviewGate(reviewers: readonly AdoListedReviewer[]): AdoListedReviewer[] {
  const required = reviewers.filter((reviewer) => reviewer.isRequired);
  return required.length > 0 ? required : [...reviewers];
}

function mapVoteStatus(
  isDraft: boolean,
  reviewers: readonly AdoListedReviewer[],
): PullRequestVoteStatus {
  if (isDraft) return "draft";
  const votes = reviewers.map((reviewer) => reviewer.vote ?? 0);
  if (votes.some((vote) => vote <= VOTE_REJECTED)) return "changes_requested";
  if (votes.some((vote) => vote === VOTE_WAITING)) return "waiting";
  const gate = reviewGate(reviewers);
  if (gate.length > 0 && gate.every((reviewer) => isApproved(reviewer.vote ?? 0))) {
    return "approved";
  }
  return "needs_review";
}

function hasMergeConflicts(mergeStatus: string | number | undefined): boolean {
  const raw = String(mergeStatus ?? "").toLowerCase();
  return raw === "conflicts" || raw === "2";
}

function mapApprovalSummary(reviewers: readonly AdoListedReviewer[]): string | null {
  const gate = reviewGate(reviewers);
  if (gate.length === 0) return null;
  const approved = gate.filter((reviewer) => isApproved(reviewer.vote ?? 0)).length;
  if (approved === 0) return null;
  return `Aprobado (${approved}/${gate.length})`;
}

export function mapAdoPullRequest(
  pullRequest: AdoListedPullRequest,
  currentUserId: string | null,
  project: string,
): PullRequestListItem | null {
  const id = pullRequest.pullRequestId;
  if (!id) return null;

  const reviewers = pullRequest.reviewers ?? [];
  const authorId = pullRequest.createdBy?.id?.trim() ?? "";
  const isDraft = Boolean(pullRequest.isDraft);
  const lifecycleStatus = mapLifecycle(pullRequest.status);

  return {
    id,
    title: pullRequest.title?.trim() || "(sin título)",
    status: mapVoteStatus(isDraft, reviewers),
    lifecycleStatus,
    approvalSummary: mapApprovalSummary(reviewers),
    sourceBranch: normalizeBranch(pullRequest.sourceRefName ?? ""),
    targetBranch: normalizeBranch(pullRequest.targetRefName ?? ""),
    author: pullRequest.createdBy?.displayName?.trim() || "Desconocido",
    reviewers: reviewers
      .map((reviewer) => reviewer.displayName?.trim() ?? "")
      .filter(Boolean),
    commentCount: 0,
    changedFileCount: 0,
    updatedAt: pullRequest.closedDate || pullRequest.creationDate || new Date().toISOString(),
    hasConflicts: hasMergeConflicts(pullRequest.mergeStatus),
    isMine: Boolean(currentUserId && authorId === currentUserId),
    needsMyReview: Boolean(
      currentUserId &&
        !isDraft &&
        lifecycleStatus === "active" &&
        reviewers.some(
          (reviewer) => reviewer.id === currentUserId && (reviewer.vote ?? 0) === 0,
        ),
    ),
    repository: pullRequest.repository?.name?.trim() || "—",
    project: pullRequest.repository?.project?.name?.trim() || project,
  };
}
