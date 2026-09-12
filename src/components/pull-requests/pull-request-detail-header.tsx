"use client";

import Link from "next/link";

import { PullRequestDetailActions } from "@/components/pull-requests/pull-request-detail-actions";
import { PullRequestDetailMeta } from "@/components/pull-requests/pull-request-detail-meta";
import { PullRequestNeedsReviewBadge } from "@/components/pull-requests/pull-request-needs-review-badge";
import { Button } from "@/components/ui/button";
import { PULL_REQUEST_BACK_TO_LIST_LABEL } from "@/lib/pull-requests/copy";
import type { PullRequestDetail } from "@/lib/pull-requests/detail-types";

export type PullRequestDetailHeaderProps = Readonly<{
  detail: PullRequestDetail;
  pending: boolean;
  onVote: (vote: number) => void;
  onAbandon: () => Promise<boolean>;
  onReactivate: () => void;
  onCancelAutoComplete: () => void;
}>;

export function PullRequestDetailHeader({
  detail,
  pending,
  onVote,
  onAbandon,
  onReactivate,
  onCancelAutoComplete,
}: PullRequestDetailHeaderProps) {
  return (
    <header className="flex min-w-0 flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button
          variant="outline"
          nativeButton={false}
          render={<Link href="/pull-requests" />}
        >
          {PULL_REQUEST_BACK_TO_LIST_LABEL}
        </Button>
        <PullRequestDetailActions
          detail={detail}
          pending={pending}
          onVote={onVote}
          onAbandon={onAbandon}
          onReactivate={onReactivate}
          onCancelAutoComplete={onCancelAutoComplete}
        />
      </div>
      <div className="flex min-w-0 flex-col gap-2">
        <div className="flex min-w-0 flex-wrap items-start gap-2">
          <h1 className="font-heading min-w-0 flex-1 text-xl font-semibold tracking-tight text-pretty sm:text-2xl">
            {detail.title}
          </h1>
          {detail.needsMyReview ? <PullRequestNeedsReviewBadge /> : null}
        </div>
        <PullRequestDetailMeta detail={detail} />
      </div>
    </header>
  );
}
