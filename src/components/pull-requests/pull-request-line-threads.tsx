import { PullRequestCommentComposer } from "@/components/pull-requests/pull-request-comment-composer";
import { PullRequestThreadList } from "@/components/pull-requests/pull-request-thread-list";
import {
  PULL_REQUEST_COMMENT_PLACEHOLDER,
  PULL_REQUEST_COMMENT_SUBMIT,
} from "@/lib/pull-requests/copy";
import type { PullRequestThread, PullRequestThreadStatus } from "@/lib/pull-requests/thread-types";

export type PullRequestLineThreadsProps = {
  threads: readonly PullRequestThread[];
  composing?: boolean;
  pending?: boolean;
  canComment?: boolean;
  onCreate?: (content: string) => Promise<boolean>;
  onCancelCompose?: () => void;
  onReply: (threadId: number, content: string) => Promise<boolean>;
  onStatusChange: (threadId: number, status: PullRequestThreadStatus) => Promise<boolean>;
};

export function PullRequestLineThreads({
  threads,
  composing = false,
  pending = false,
  canComment = true,
  onCreate,
  onCancelCompose,
  onReply,
  onStatusChange,
}: PullRequestLineThreadsProps) {
  if (!composing && threads.length === 0) return null;

  return (
    <div className="border-y bg-muted/20 px-3 py-2">
      <PullRequestThreadList
        threads={threads}
        pending={pending}
        canReply={canComment}
        showLocation={false}
        onReply={onReply}
        onStatusChange={onStatusChange}
      />
      {composing && onCreate ? (
        <div className={threads.length > 0 ? "mt-2" : undefined}>
          <PullRequestCommentComposer
            placeholder={PULL_REQUEST_COMMENT_PLACEHOLDER}
            submitLabel={PULL_REQUEST_COMMENT_SUBMIT}
            pending={pending}
            onCancel={onCancelCompose}
            onSubmit={onCreate}
          />
        </div>
      ) : null}
    </div>
  );
}
