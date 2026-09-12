import { PersonLabel } from "@/components/team-members/person-label";
import type { PullRequestDetailReviewer } from "@/lib/pull-requests/detail-types";
import { reviewerVoteLabel } from "@/lib/pull-requests/vote";
import { cn } from "@/lib/utils";

export type PullRequestReviewerRowProps = {
  reviewer: PullRequestDetailReviewer;
};

export function PullRequestReviewerRow({ reviewer }: PullRequestReviewerRowProps) {
  const label = reviewerVoteLabel(reviewer.vote);
  const muted = reviewer.vote === 0;

  return (
    <li className="flex items-center justify-between gap-2 py-1.5">
      <PersonLabel name={reviewer.displayName} className="min-w-0" />
      <span
        className={cn(
          "shrink-0 text-[11px]",
          muted ? "text-muted-foreground" : "text-foreground",
        )}
      >
        {label}
      </span>
    </li>
  );
}
