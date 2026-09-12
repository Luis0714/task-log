"use client";

import Link from "next/link";
import { FileDiff, MessageSquare } from "lucide-react";

import { PullRequestCopyHelpButton } from "@/components/pull-requests/pull-request-copy-help-button";
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
import { buildPullRequestDetailHref } from "@/lib/pull-requests/detail-path";
import type { PullRequestListItem } from "@/lib/pull-requests/types";
import { cn } from "@/lib/utils";

export type PullRequestCardProps = {
  item: PullRequestListItem;
  density?: "compact" | "comfortable";
  className?: string;
};

export function PullRequestCard({ item, className }: PullRequestCardProps) {
  const href = buildPullRequestDetailHref(item.id, item.repository);

  return (
    <article
      className={cn(
        "relative w-full rounded-xl border bg-card p-3 text-left transition-colors",
        "hover:border-border/80 hover:bg-muted/30",
        className,
      )}
    >
      <Link
        href={href}
        aria-label={`Abrir pull request #${item.id}: ${item.title}`}
        className={cn(
          "absolute inset-0 z-10 rounded-xl",
          "focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none",
        )}
      />

      <div className="pointer-events-none relative z-20 flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-2">
            <PullRequestId id={item.id} />
            <PullRequestRepoBadge repository={item.repository} />
          </div>
          <PullRequestTitle title={item.title} className="mt-1" />
        </div>
        <div className="flex shrink-0 items-start gap-1">
          <PullRequestCopyHelpButton
            pullRequestId={item.id}
            project={item.project}
            repository={item.repository}
            className="pointer-events-auto"
          />
          <div className="flex flex-col items-end gap-1">
            {item.hasConflicts ? <PullRequestConflictBadge /> : null}
            <PullRequestStatusBadge
              status={item.status}
              summary={item.approvalSummary}
              className="max-w-36"
            />
          </div>
        </div>
      </div>

      <GitBranchPair
        source={item.sourceBranch}
        target={item.targetBranch}
        className="pointer-events-none relative z-20 mt-2"
      />

      <div className="pointer-events-none relative z-20 mt-2 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
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
    </article>
  );
}
