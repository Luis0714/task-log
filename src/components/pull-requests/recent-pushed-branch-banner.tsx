"use client";

import { Info } from "lucide-react";
import Link from "next/link";

import { NoticeBanner } from "@/components/shared/notice-banner";
import { RelativeTimeLabel } from "@/components/shared/relative-time-label";
import { Button } from "@/components/ui/button";
import { CREATE_PULL_REQUEST_LABEL } from "@/lib/pull-requests/copy";
import { buildNewPullRequestHref } from "@/lib/pull-requests/create-query";
import type { RecentPushedBranch } from "@/lib/pull-requests/mock-recent-pushed-branch";

export type RecentPushedBranchBannerProps = {
  suggestion: RecentPushedBranch;
  pushedAt: string;
  onDismiss: () => void;
};

export function RecentPushedBranchBanner({
  suggestion,
  pushedAt,
  onDismiss,
}: RecentPushedBranchBannerProps) {
  const href = buildNewPullRequestHref({
    repository: suggestion.repository,
    source: suggestion.sourceBranch,
    target: suggestion.targetBranch,
  });

  return (
    <NoticeBanner
      icon={<Info className="text-muted-foreground mt-0.5 size-4 shrink-0" aria-hidden />}
      onDismiss={onDismiss}
      action={
        <Button
          size="sm"
          nativeButton={false}
          render={<Link href={href} />}
        >
          {CREATE_PULL_REQUEST_LABEL}
        </Button>
      }
    >
      <p className="text-pretty">
        Actualizaste{" "}
        <span className="text-foreground font-mono font-medium">
          {suggestion.sourceBranch}
        </span>{" "}
        <RelativeTimeLabel isoDate={pushedAt} className="text-muted-foreground text-sm" />
      </p>
    </NoticeBanner>
  );
}
