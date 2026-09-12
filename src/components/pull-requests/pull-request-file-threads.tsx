import { PullRequestThreadList } from "@/components/pull-requests/pull-request-thread-list";
import { normalizeThreadFilePath } from "@/lib/pull-requests/thread-line-key";
import type { PullRequestThread, PullRequestThreadStatus } from "@/lib/pull-requests/thread-types";

export type PullRequestFileThreadsProps = Readonly<{
  filePath: string;
  threads: readonly PullRequestThread[];
  pending?: boolean;
  canComment?: boolean;
  onReply: (threadId: number, content: string) => Promise<boolean>;
  onStatusChange: (threadId: number, status: PullRequestThreadStatus) => Promise<boolean>;
}>;

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

export function PullRequestFileThreads({
  filePath,
  threads,
  pending,
  canComment,
  onReply,
  onStatusChange,
}: PullRequestFileThreadsProps) {
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
}
