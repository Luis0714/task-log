"use client";

import { useState } from "react";

import { ChangesetExplorer } from "@/components/git/changeset-explorer";
import { PullRequestLineThreads } from "@/components/pull-requests/pull-request-line-threads";
import { PullRequestThreadList } from "@/components/pull-requests/pull-request-thread-list";
import type { GitDiffLine } from "@/lib/git/changeset";
import type { PullRequestDetail } from "@/lib/pull-requests/detail-types";
import {
  diffLineCommentKey,
  lineAnchorFromDiffLine,
  normalizeThreadFilePath,
} from "@/lib/pull-requests/thread-line-key";
import type { PullRequestThread, PullRequestThreadStatus } from "@/lib/pull-requests/thread-types";

export type PullRequestFilesPanelProps = {
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
};

type LineDraft = {
  filePath: string;
  line: GitDiffLine;
};

function fileLevelThreads(
  threads: readonly PullRequestThread[],
  filePath: string,
): PullRequestThread[] {
  const path = normalizeThreadFilePath(filePath);
  return threads.filter(
    (thread) =>
      thread.filePath !== null &&
      normalizeThreadFilePath(thread.filePath) === path &&
      thread.line == null,
  );
}

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
      fileExtra={(filePath) => {
        const fileThreads = fileLevelThreads(threads, filePath);
        if (fileThreads.length === 0) return null;
        return (
          <div className="border-b px-3 py-2">
            <PullRequestThreadList
              threads={fileThreads}
              pending={pending}
              canReply={canComment}
              showLocation={false}
              onReply={onReply}
              onStatusChange={onStatusChange}
            />
          </div>
        );
      }}
      renderAfterLine={(filePath, line) => {
        const key = diffLineCommentKey(filePath, line);
        const lineThreads = key ? (threadsByLine.get(key) ?? []) : [];
        const composing = isDraftLine(filePath, line);
        return (
          <PullRequestLineThreads
            threads={lineThreads}
            composing={composing}
            pending={pending}
            canComment={canComment}
            onCancelCompose={() => setDraft(null)}
            onCreate={
              composing
                ? async (content) => {
                    const anchor = lineAnchorFromDiffLine(line);
                    if (!anchor) return false;
                    const ok = await onCreate({
                      content,
                      filePath,
                      line: anchor.line,
                      lineSide: anchor.lineSide,
                    });
                    if (ok) setDraft(null);
                    return ok;
                  }
                : undefined
            }
            onReply={onReply}
            onStatusChange={onStatusChange}
          />
        );
      }}
    />
  );
}
