import { RelativeTimeLabel } from "@/components/shared/relative-time-label";
import { PersonLabel } from "@/components/team-members/person-label";
import type { PullRequestThreadComment } from "@/lib/pull-requests/thread-types";

export type PullRequestCommentItemProps = Readonly<{
  comment: PullRequestThreadComment;
}>;

export function PullRequestCommentItem({ comment }: PullRequestCommentItemProps) {
  return (
    <article className="min-w-0">
      <div className="flex min-w-0 items-center justify-between gap-2">
        <PersonLabel name={comment.author} className="min-w-0 text-muted-foreground" />
        <RelativeTimeLabel isoDate={comment.createdAt} />
      </div>
      <p className="mt-1 whitespace-pre-wrap text-sm">{comment.content}</p>
    </article>
  );
}
