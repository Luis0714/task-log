"use client";

import { useState } from "react";

import { PullRequestCommentComposer } from "@/components/pull-requests/pull-request-comment-composer";
import { PullRequestCommentItem } from "@/components/pull-requests/pull-request-comment-item";
import { PullRequestThreadStatusSelect } from "@/components/pull-requests/pull-request-thread-status-select";
import { Button } from "@/components/ui/button";
import {
  PULL_REQUEST_REPLY_PLACEHOLDER,
  PULL_REQUEST_REPLY_SUBMIT,
} from "@/lib/pull-requests/copy";
import type { PullRequestThread, PullRequestThreadStatus } from "@/lib/pull-requests/thread-types";
import { cn } from "@/lib/utils";

export type PullRequestThreadCardProps = {
  thread: PullRequestThread;
  pending?: boolean;
  canReply?: boolean;
  showLocation?: boolean;
  onReply: (threadId: number, content: string) => Promise<boolean>;
  onStatusChange: (threadId: number, status: PullRequestThreadStatus) => Promise<boolean>;
};

export function PullRequestThreadCard({
  thread,
  pending = false,
  canReply = true,
  showLocation = true,
  onReply,
  onStatusChange,
}: PullRequestThreadCardProps) {
  const [replyOpen, setReplyOpen] = useState(false);

  return (
    <section className={cn("rounded-lg border bg-card px-3 py-3")}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <PullRequestThreadStatusSelect
          value={thread.status}
          disabled={pending}
          onValueChange={(status) => {
            void onStatusChange(thread.id, status);
          }}
        />
        {showLocation && thread.filePath && thread.line ? (
          <p className="text-muted-foreground font-mono text-[11px]">
            {thread.filePath}:{thread.line}
          </p>
        ) : null}
      </div>

      <div className="mt-3 flex flex-col gap-3">
        {thread.comments.map((comment) => (
          <PullRequestCommentItem key={comment.id} comment={comment} />
        ))}
      </div>

      {canReply && !replyOpen ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="mt-2"
          disabled={pending}
          onClick={() => setReplyOpen(true)}
        >
          Responder
        </Button>
      ) : null}

      {canReply && replyOpen ? (
        <div className="mt-3">
          <PullRequestCommentComposer
            placeholder={PULL_REQUEST_REPLY_PLACEHOLDER}
            submitLabel={PULL_REQUEST_REPLY_SUBMIT}
            pending={pending}
            onCancel={() => setReplyOpen(false)}
            onSubmit={async (content) => {
              const ok = await onReply(thread.id, content);
              if (ok) setReplyOpen(false);
              return ok;
            }}
          />
        </div>
      ) : null}
    </section>
  );
}
