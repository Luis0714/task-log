import { PullRequestLineThreads } from "@/components/pull-requests/pull-request-line-threads";
import type { GitDiffLine } from "@/lib/git/changeset";
import {
  diffLineCommentKey,
  lineAnchorFromDiffLine,
} from "@/lib/pull-requests/thread-line-key";
import type { PullRequestThread, PullRequestThreadStatus } from "@/lib/pull-requests/thread-types";

export type PullRequestDiffLineCommentsProps = Readonly<{
  filePath: string;
  line: GitDiffLine;
  threadsByLine: ReadonlyMap<string, readonly PullRequestThread[]>;
  composing: boolean;
  pending?: boolean;
  canComment?: boolean;
  onCancelCompose: () => void;
  onCreate: (input: {
    content: string;
    filePath: string;
    line?: number;
    lineSide?: "left" | "right";
  }) => Promise<boolean>;
  onReply: (threadId: number, content: string) => Promise<boolean>;
  onStatusChange: (threadId: number, status: PullRequestThreadStatus) => Promise<boolean>;
}>;

export function PullRequestDiffLineComments({
  filePath,
  line,
  threadsByLine,
  composing,
  pending,
  canComment,
  onCancelCompose,
  onCreate,
  onReply,
  onStatusChange,
}: PullRequestDiffLineCommentsProps) {
  const key = diffLineCommentKey(filePath, line);
  const lineThreads = key ? (threadsByLine.get(key) ?? []) : [];

  return (
    <PullRequestLineThreads
      threads={lineThreads}
      composing={composing}
      pending={pending}
      canComment={canComment}
      onCancelCompose={onCancelCompose}
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
              return ok;
            }
          : undefined
      }
      onReply={onReply}
      onStatusChange={onStatusChange}
    />
  );
}
