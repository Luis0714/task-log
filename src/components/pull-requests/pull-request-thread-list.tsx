import { PullRequestThreadCard } from "@/components/pull-requests/pull-request-thread-card";
import type { PullRequestThread, PullRequestThreadStatus } from "@/lib/pull-requests/thread-types";

export type PullRequestThreadListProps = {
  threads: readonly PullRequestThread[];
  pending?: boolean;
  canReply?: boolean;
  showLocation?: boolean;
  onReply: (threadId: number, content: string) => Promise<boolean>;
  onStatusChange: (threadId: number, status: PullRequestThreadStatus) => Promise<boolean>;
};

export function PullRequestThreadList({
  threads,
  pending,
  canReply,
  showLocation,
  onReply,
  onStatusChange,
}: PullRequestThreadListProps) {
  if (threads.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      {threads.map((thread) => (
        <PullRequestThreadCard
          key={thread.id}
          thread={thread}
          pending={pending}
          canReply={canReply}
          showLocation={showLocation}
          onReply={onReply}
          onStatusChange={onStatusChange}
        />
      ))}
    </div>
  );
}
