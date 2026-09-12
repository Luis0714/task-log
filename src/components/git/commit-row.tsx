import { CircleCheck } from "lucide-react";

import { RelativeTimeLabel } from "@/components/shared/relative-time-label";
import type { GitCommit } from "@/lib/git/changeset";

export type CommitRowProps = Readonly<{
  commit: GitCommit;
}>;

export function CommitRow({ commit }: CommitRowProps) {
  return (
    <li className="flex min-w-0 flex-col gap-1 border-b border-border/70 px-3 py-2.5 last:border-b-0">
      <p className="min-w-0 truncate text-sm leading-snug text-foreground" title={commit.message}>
        {commit.message}
      </p>
      <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px]">
        <span className="font-mono text-muted-foreground">{commit.shortId}</span>
        <CircleCheck className="size-3.5 shrink-0 text-emerald-600" aria-hidden />
        <span className="text-muted-foreground truncate">{commit.author}</span>
        <RelativeTimeLabel isoDate={commit.authoredAt} />
      </div>
    </li>
  );
}
