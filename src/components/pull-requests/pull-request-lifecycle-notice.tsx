import { CheckCircle2, CircleAlert, Sparkles } from "lucide-react";

import { NoticeBanner } from "@/components/shared/notice-banner";
import { RelativeTimeLabel } from "@/components/shared/relative-time-label";
import type { PullRequestDetail } from "@/lib/pull-requests/detail-types";

export type PullRequestLifecycleNoticeProps = {
  detail: PullRequestDetail;
};

export function PullRequestLifecycleNotice({ detail }: PullRequestLifecycleNoticeProps) {
  if (detail.lifecycleStatus === "completed") {
    return (
      <NoticeBanner
        icon={<CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" aria-hidden />}
      >
        <p>
          {detail.closedBy || detail.author} completó este pull request
          {detail.closedAt ? (
            <>
              {" "}
              <RelativeTimeLabel isoDate={detail.closedAt} className="inline text-sm" />
            </>
          ) : null}
          .
        </p>
        {detail.mergeCommitId ? (
          <p className="text-muted-foreground mt-1 font-mono text-xs">
            Fusionado {detail.mergeCommitId.slice(0, 8)}
            {detail.mergeCommitAuthor ? ` · ${detail.mergeCommitAuthor}` : ""}
          </p>
        ) : null}
      </NoticeBanner>
    );
  }

  if (detail.lifecycleStatus === "abandoned") {
    return (
      <NoticeBanner
        icon={<CircleAlert className="text-muted-foreground mt-0.5 size-4 shrink-0" aria-hidden />}
      >
        <p>
          Este pull request se abandonó
          {detail.closedAt ? (
            <>
              {" "}
              <RelativeTimeLabel isoDate={detail.closedAt} className="inline text-sm" />
            </>
          ) : null}
          .
        </p>
      </NoticeBanner>
    );
  }

  if (!detail.autoCompleteSetBy) return null;

  return (
    <NoticeBanner
      icon={<Sparkles className="mt-0.5 size-4 shrink-0 text-sky-600" aria-hidden />}
    >
      <p>
        {detail.autoCompleteSetBy} activó el autocompletado. Se completará cuando se
        cumplan los requisitos.
      </p>
    </NoticeBanner>
  );
}
