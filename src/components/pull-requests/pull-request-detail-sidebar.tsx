import { PullRequestLabelsCard } from "@/components/pull-requests/pull-request-labels-card";
import { PullRequestReviewersCard } from "@/components/pull-requests/pull-request-reviewers-card";
import { PullRequestWorkItemsCard } from "@/components/pull-requests/pull-request-work-items-card";
import type { PullRequestDetail } from "@/lib/pull-requests/detail-types";

export type PullRequestDetailSidebarProps = {
  detail: PullRequestDetail;
};

export function PullRequestDetailSidebar({ detail }: PullRequestDetailSidebarProps) {
  return (
    <aside className="flex min-w-0 flex-col gap-3 md:w-72 md:shrink-0">
      <PullRequestReviewersCard reviewers={detail.reviewers} />
      <PullRequestLabelsCard labels={detail.labels} />
      <PullRequestWorkItemsCard workItems={detail.workItems} />
    </aside>
  );
}
