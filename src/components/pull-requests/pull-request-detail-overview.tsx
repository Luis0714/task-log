import { PullRequestCheckList } from "@/components/pull-requests/pull-request-check-list";
import { PullRequestConflictFiles } from "@/components/pull-requests/pull-request-conflict-files";
import { PullRequestDescriptionBlock } from "@/components/pull-requests/pull-request-description-block";
import { PullRequestDetailSidebar } from "@/components/pull-requests/pull-request-detail-sidebar";
import { PullRequestLifecycleNotice } from "@/components/pull-requests/pull-request-lifecycle-notice";
import type { PullRequestDetail } from "@/lib/pull-requests/detail-types";

export type PullRequestDetailOverviewProps = {
  detail: PullRequestDetail;
};

export function PullRequestDetailOverview({ detail }: PullRequestDetailOverviewProps) {
  return (
    <div className="flex min-w-0 flex-col gap-3 md:flex-row md:items-start">
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <PullRequestLifecycleNotice detail={detail} />
        <PullRequestCheckList checks={detail.checks} />
        <PullRequestDescriptionBlock description={detail.description} />
        {detail.hasConflicts ? (
          <PullRequestConflictFiles files={detail.conflictedFiles} />
        ) : null}
      </div>
      <PullRequestDetailSidebar detail={detail} />
    </div>
  );
}
