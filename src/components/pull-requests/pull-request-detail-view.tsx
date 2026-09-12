"use client";

import { Info } from "lucide-react";

import { PullRequestDetailHeader } from "@/components/pull-requests/pull-request-detail-header";
import { PullRequestDetailSkeleton } from "@/components/pull-requests/pull-request-detail-skeleton";
import { PullRequestDetailTabs } from "@/components/pull-requests/pull-request-detail-tabs";
import { NoticeBanner } from "@/components/shared/notice-banner";
import { usePullRequestDetail } from "@/hooks/pull-requests/use-pull-request-detail";
import { PULL_REQUEST_DETAIL_ERROR } from "@/lib/pull-requests/copy";

export type PullRequestDetailViewProps = {
  project: string | null;
  pullRequestId: number;
  repository?: string;
};

export function PullRequestDetailView({
  project,
  pullRequestId,
  repository,
}: PullRequestDetailViewProps) {
  const detail = usePullRequestDetail({ project, pullRequestId, repository });

  if (!project) {
    return (
      <NoticeBanner icon={<Info className="mt-0.5 size-4 shrink-0" aria-hidden />}>
        <p>Selecciona un proyecto para ver el pull request.</p>
      </NoticeBanner>
    );
  }

  if (detail.loading) return <PullRequestDetailSkeleton />;

  if (detail.error || !detail.detail) {
    return (
      <NoticeBanner
        icon={<Info className="text-destructive mt-0.5 size-4 shrink-0" aria-hidden />}
      >
        <p>{detail.error || PULL_REQUEST_DETAIL_ERROR}</p>
      </NoticeBanner>
    );
  }

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col gap-5">
      <PullRequestDetailHeader
        detail={detail.detail}
        pending={detail.pending}
        onVote={detail.vote}
        onAbandon={detail.abandon}
        onReactivate={detail.reactivate}
        onCancelAutoComplete={detail.cancelAutoComplete}
      />
      <PullRequestDetailTabs detail={detail.detail} />
    </div>
  );
}
