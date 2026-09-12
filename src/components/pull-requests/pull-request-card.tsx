"use client";

import { FileDiff, MessageSquare } from "lucide-react";

import { PullRequestId } from "@/components/pull-requests/pull-request-id";
import { PullRequestMineBadge } from "@/components/pull-requests/pull-request-mine-badge";
import { PullRequestNeedsReviewBadge } from "@/components/pull-requests/pull-request-needs-review-badge";
import { PullRequestRepoBadge } from "@/components/pull-requests/pull-request-repo-badge";
import { PullRequestConflictBadge } from "@/components/pull-requests/pull-request-conflict-badge";
import { PullRequestStatusBadge } from "@/components/pull-requests/pull-request-status-badge";
import { PullRequestTitle } from "@/components/pull-requests/pull-request-title";
import { GitBranchPair } from "@/components/shared/git-branch-pair";
import { IconCount } from "@/components/shared/icon-count";
import { RelativeTimeLabel } from "@/components/shared/relative-time-label";
import { PersonLabel } from "@/components/team-members/person-label";
import type { PullRequestListItem } from "@/lib/pull-requests/types";
import { cn } from "@/lib/utils";

export type PullRequestCardProps = {
  item: PullRequestListItem;
  density?: "compact" | "comfortable";
  onSelect?: (id: number) => void;
  className?: string;
};

export function PullRequestCard({
  item,
  onSelect,
  className,
}: PullRequestCardProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect?.(item.id)}
      className={cn(
        "w-full rounded-xl border bg-card p-3 text-left transition-colors",
        "hover:border-border/80 hover:bg-muted/30",
        "focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-2">
            <PullRequestId id={item.id} />
            <PullRequestRepoBadge repository={item.repository} />
          </div>
          <PullRequestTitle title={item.title} className="mt-1" />
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          {item.hasConflicts ? <PullRequestConflictBadge /> : null}
          <PullRequestStatusBadge
            status={item.status}
            summary={item.approvalSummary}
            className="max-w-36"
          />
        </div>
      </div>

      <GitBranchPair
        source={item.sourceBranch}
        target={item.targetBranch}
        className="mt-2"
      />

      <div className="mt-2 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
        <PersonLabel name={item.author} className="min-w-0 flex-1 text-muted-foreground" />
        {item.commentCount > 0 ? (
          <IconCount
            icon={<MessageSquare />}
            count={item.commentCount}
            label="Comentarios"
          />
        ) : null}
        {item.changedFileCount > 0 ? (
          <IconCount
            icon={<FileDiff />}
            count={item.changedFileCount}
            label="Archivos modificados"
          />
        ) : null}
        <RelativeTimeLabel isoDate={item.updatedAt} />
        {item.needsMyReview ? <PullRequestNeedsReviewBadge /> : null}
        {item.isMine ? <PullRequestMineBadge /> : null}
      </div>
    </button>
  );
}
