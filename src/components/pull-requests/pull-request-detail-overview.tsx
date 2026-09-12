import { PullRequestCheckList } from "@/components/pull-requests/pull-request-check-list";
import { PullRequestConflictFiles } from "@/components/pull-requests/pull-request-conflict-files";
import { PullRequestDescriptionBlock } from "@/components/pull-requests/pull-request-description-block";
import { PullRequestDetailSidebar } from "@/components/pull-requests/pull-request-detail-sidebar";
import { PullRequestGeneralComments } from "@/components/pull-requests/pull-request-general-comments";
import { PullRequestLifecycleNotice } from "@/components/pull-requests/pull-request-lifecycle-notice";
import type { PullRequestDetail } from "@/lib/pull-requests/detail-types";
import type { PullRequestThread, PullRequestThreadStatus } from "@/lib/pull-requests/thread-types";

export type PullRequestDetailOverviewProps = {
  detail: PullRequestDetail;
  generalThreads: readonly PullRequestThread[];
  threadsLoading?: boolean;
  threadsError?: string | null;
  threadsPending?: boolean;
  canComment?: boolean;
  onCreateComment: (content: string) => Promise<boolean>;
  onReply: (threadId: number, content: string) => Promise<boolean>;
  onStatusChange: (threadId: number, status: PullRequestThreadStatus) => Promise<boolean>;
};

export function PullRequestDetailOverview({
  detail,
  generalThreads,
  threadsLoading,
  threadsError,
  threadsPending,
  canComment,
  onCreateComment,
  onReply,
  onStatusChange,
}: PullRequestDetailOverviewProps) {
  return (
    <div className="flex min-w-0 flex-col gap-3 md:flex-row md:items-start">
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <PullRequestLifecycleNotice detail={detail} />
        <PullRequestCheckList checks={detail.checks} />
        <PullRequestDescriptionBlock description={detail.description} />
        {detail.hasConflicts ? (
          <PullRequestConflictFiles files={detail.conflictedFiles} />
        ) : null}
        <PullRequestGeneralComments
          threads={generalThreads}
          loading={threadsLoading}
          error={threadsError}
          pending={threadsPending}
          canComment={canComment}
          onCreate={onCreateComment}
          onReply={onReply}
          onStatusChange={onStatusChange}
        />
      </div>
      <PullRequestDetailSidebar detail={detail} />
    </div>
  );
}
