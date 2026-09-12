"use client";

import { useState } from "react";

import { ChangesetExplorer } from "@/components/git/changeset-explorer";
import { PullRequestDiffLineComments } from "@/components/pull-requests/pull-request-diff-line-comments";
import { PullRequestFileThreads } from "@/components/pull-requests/pull-request-file-threads";
import type { GitDiffLine } from "@/lib/git/changeset";
import type { PullRequestDetail } from "@/lib/pull-requests/detail-types";
import { diffLineCommentKey } from "@/lib/pull-requests/thread-line-key";
import type { PullRequestThread, PullRequestThreadStatus } from "@/lib/pull-requests/thread-types";

export type PullRequestFilesPanelProps = Readonly<{
  detail: PullRequestDetail;
  threads: readonly PullRequestThread[];
  threadsByLine: ReadonlyMap<string, readonly PullRequestThread[]>;
  pending?: boolean;
  canComment?: boolean;
  onCreate: (input: {
    content: string;
    filePath: string;
    line?: number;
    lineSide?: "left" | "right";
  }) => Promise<boolean>;
  onReply: (threadId: number, content: string) => Promise<boolean>;
  onStatusChange: (threadId: number, status: PullRequestThreadStatus) => Promise<boolean>;
}>;

type LineDraft = {
  filePath: string;
  line: GitDiffLine;
};

export function PullRequestFilesPanel({
  detail,
  threads,
  threadsByLine,
  pending = false,
  canComment = true,
  onCreate,
  onReply,
  onStatusChange,
}: PullRequestFilesPanelProps) {
  const [draft, setDraft] = useState<LineDraft | null>(null);

  function isDraftLine(filePath: string, line: GitDiffLine): boolean {
    if (!draft) return false;
    return (
      diffLineCommentKey(draft.filePath, draft.line) ===
      diffLineCommentKey(filePath, line)
    );
  }

  return (
    <ChangesetExplorer
      files={detail.files}
      query={{
        project: detail.project,
        repository: detail.repository,
        source: detail.compare.source,
        target: detail.compare.target,
      }}
      onAddComment={
        canComment
          ? (filePath, line) => setDraft({ filePath, line })
          : undefined
      }
      fileExtra={(filePath) => (
        <PullRequestFileThreads
          filePath={filePath}
          threads={threads}
          pending={pending}
          canComment={canComment}
          onReply={onReply}
          onStatusChange={onStatusChange}
        />
      )}
      renderAfterLine={(filePath, line) => (
        <PullRequestDiffLineComments
          filePath={filePath}
          line={line}
          threadsByLine={threadsByLine}
          composing={isDraftLine(filePath, line)}
          pending={pending}
          canComment={canComment}
          onCancelCompose={() => setDraft(null)}
          onCreate={async (input) => {
            const ok = await onCreate(input);
            if (ok) setDraft(null);
            return ok;
          }}
          onReply={onReply}
          onStatusChange={onStatusChange}
        />
      )}
    />
  );
}
