import { isApprovedVote } from "@/lib/pull-requests/vote";
import type { ReviewCommentSignal } from "@/lib/review-times/types";

export type ReviewMilestones = {
  reviewedAt: string | null;
  approvedAt: string | null;
};

function sameId(left: string, right: string): boolean {
  return left.trim().toLowerCase() === right.trim().toLowerCase();
}

function earliest(current: string | null, candidate: string): string {
  if (!current) return candidate;
  return Date.parse(candidate) < Date.parse(current) ? candidate : current;
}

function isReviewVote(vote: number | null): boolean {
  return vote != null && vote !== 0;
}

export function resolveReviewMilestones(
  signals: readonly ReviewCommentSignal[],
  reviewerId: string,
): ReviewMilestones {
  let reviewedAt: string | null = null;
  let approvedAt: string | null = null;

  for (const signal of signals) {
    if (!sameId(signal.authorId, reviewerId)) continue;
    if (!Number.isFinite(Date.parse(signal.publishedAt))) continue;

    const countsAsReview =
      signal.kind === "text" || (signal.kind === "vote" && isReviewVote(signal.vote));
    if (countsAsReview) {
      reviewedAt = earliest(reviewedAt, signal.publishedAt);
    }

    if (signal.kind === "vote" && signal.vote != null && isApprovedVote(signal.vote)) {
      approvedAt = earliest(approvedAt, signal.publishedAt);
    }
  }

  return { reviewedAt, approvedAt };
}
