import { Info } from "lucide-react";

import { PullRequestCommentComposer } from "@/components/pull-requests/pull-request-comment-composer";
import { PullRequestThreadList } from "@/components/pull-requests/pull-request-thread-list";
import { NoticeBanner } from "@/components/shared/notice-banner";
import { Skeleton } from "@/components/ui/skeleton";
import {
  PULL_REQUEST_COMMENT_PLACEHOLDER,
  PULL_REQUEST_COMMENT_SUBMIT,
  PULL_REQUEST_THREADS_ERROR,
} from "@/lib/pull-requests/copy";
import type { PullRequestThread, PullRequestThreadStatus } from "@/lib/pull-requests/thread-types";

export type PullRequestGeneralCommentsProps = {
  threads: readonly PullRequestThread[];
  loading?: boolean;
  error?: string | null;
  pending?: boolean;
  canComment?: boolean;
  onCreate: (content: string) => Promise<boolean>;
  onReply: (threadId: number, content: string) => Promise<boolean>;
  onStatusChange: (threadId: number, status: PullRequestThreadStatus) => Promise<boolean>;
};

export function PullRequestGeneralComments({
  threads,
  loading = false,
  error = null,
  pending = false,
  canComment = true,
  onCreate,
  onReply,
  onStatusChange,
}: PullRequestGeneralCommentsProps) {
  return (
    <section className="flex min-w-0 flex-col gap-3 rounded-xl border bg-card p-3">
      <h2 className="text-sm font-medium">Comentarios</h2>

      {loading ? (
        <div className="flex flex-col gap-2" aria-hidden>
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : null}

      {!loading && error ? (
        <NoticeBanner
          icon={<Info className="text-destructive mt-0.5 size-4 shrink-0" aria-hidden />}
        >
          <p>{error || PULL_REQUEST_THREADS_ERROR}</p>
        </NoticeBanner>
      ) : null}

      {!loading && !error ? (
        <PullRequestThreadList
          threads={threads}
          pending={pending}
          canReply={canComment}
          onReply={onReply}
          onStatusChange={onStatusChange}
        />
      ) : null}

      {!loading && !error && threads.length === 0 ? (
        <p className="text-muted-foreground text-sm">Aún no hay comentarios generales.</p>
      ) : null}

      {canComment ? (
        <PullRequestCommentComposer
          placeholder={PULL_REQUEST_COMMENT_PLACEHOLDER}
          submitLabel={PULL_REQUEST_COMMENT_SUBMIT}
          pending={pending}
          onSubmit={onCreate}
        />
      ) : null}
    </section>
  );
}
