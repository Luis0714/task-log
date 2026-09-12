import { ArrowRight, GitBranch } from "lucide-react";

import { PullRequestId } from "@/components/pull-requests/pull-request-id";
import { PullRequestLifecycleBadge } from "@/components/pull-requests/pull-request-lifecycle-badge";
import { PullRequestRepoBadge } from "@/components/pull-requests/pull-request-repo-badge";
import { PersonLabel } from "@/components/team-members/person-label";
import type { PullRequestDetail } from "@/lib/pull-requests/detail-types";

export type PullRequestDetailMetaProps = {
  detail: PullRequestDetail;
};

export function PullRequestDetailMeta({ detail }: PullRequestDetailMetaProps) {
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <PullRequestLifecycleBadge status={detail.lifecycleStatus} />
        <PullRequestId id={detail.id} />
        <PullRequestRepoBadge repository={detail.repository} />
        <PersonLabel name={detail.author} className="text-muted-foreground" />
      </div>
      <p className="text-muted-foreground flex min-w-0 flex-wrap items-center gap-1.5 text-sm">
        <span>propone fusionar</span>
        <span
          className="inline-flex min-w-0 items-center gap-1 font-mono text-[12px]"
          title={`${detail.sourceBranch} → ${detail.targetBranch}`}
        >
          <GitBranch className="size-3 shrink-0" aria-hidden />
          <span className="truncate">{detail.sourceBranch}</span>
          <ArrowRight className="size-3 shrink-0" aria-hidden />
          <span className="truncate">{detail.targetBranch}</span>
        </span>
      </p>
    </div>
  );
}
