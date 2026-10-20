import { resolveReadyAt } from "@/lib/review-times/resolve-ready-at";
import { resolveReviewMilestones } from "@/lib/review-times/resolve-review-milestones";
import { reviewTimeStatus } from "@/lib/review-times/filter-rows";
import type {
  PolicySignal,
  ReviewCommentSignal,
  ReviewTimePullRequest,
  ReviewTimeRow,
} from "@/lib/review-times/types";
import { NO_REQUIRED_REVIEWER_NAME } from "@/lib/review-times/types";

export function buildReviewTimeRows(input: {
  pullRequest: ReviewTimePullRequest;
  signals: readonly ReviewCommentSignal[];
  policies: readonly PolicySignal[];
}): ReviewTimeRow[] {
  const ready = resolveReadyAt(input.policies);
  const required = input.pullRequest.reviewers.filter((reviewer) => reviewer.isRequired && reviewer.id.trim());
  const shared = {
    pullRequestId: input.pullRequest.id,
    title: input.pullRequest.title,
    repository: input.pullRequest.repository,
    authorId: input.pullRequest.authorId,
    authorName: input.pullRequest.authorName,
    createdAt: input.pullRequest.createdAt,
    readyAt: ready.readyAt,
    readyState: ready.readyState,
    isDraft: input.pullRequest.isDraft,
  };

  if (required.length === 0) {
    return [
      {
        ...shared,
        reviewerId: null,
        reviewerName: NO_REQUIRED_REVIEWER_NAME,
        reviewedAt: null,
        approvedAt: null,
        status: "pending_review",
      },
    ];
  }

  return required.map((reviewer) => {
    const milestones = resolveReviewMilestones(input.signals, reviewer.id);
    return {
      ...shared,
      reviewerId: reviewer.id,
      reviewerName: reviewer.displayName.trim() || "Revisor",
      reviewedAt: milestones.reviewedAt,
      approvedAt: milestones.approvedAt,
      status: reviewTimeStatus(milestones),
    };
  });
}
