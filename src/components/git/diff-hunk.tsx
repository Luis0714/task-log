import { useMemo, type ReactNode } from "react";

import { DiffLine } from "@/components/git/diff-line";
import type { GitDiffHunk, GitDiffLine } from "@/lib/git/changeset";
import {
  findDiffChangeAtLine,
  type DiffChangeAnchor,
} from "@/lib/git/diff-changes";
import { inlineDiffsForLines } from "@/lib/git/inline-diff";

export type DiffHunkProps = Readonly<{
  hunk: GitDiffHunk;
  hunkIndex: number;
  changes: readonly DiffChangeAnchor[];
  activeChangeId: string | null;
  onAddComment?: (line: GitDiffLine) => void;
  renderAfterLine?: (line: GitDiffLine) => ReactNode;
}>;

export function DiffHunk({
  hunk,
  hunkIndex,
  changes,
  activeChangeId,
  onAddComment,
  renderAfterLine,
}: DiffHunkProps) {
  const inlineByLine = useMemo(() => inlineDiffsForLines(hunk.lines), [hunk.lines]);

  return (
    <div className="min-w-0">
      <p className="bg-muted/80 px-2 py-1 font-mono text-[11px] text-muted-foreground">
        {hunk.header}
      </p>
      {hunk.lines.map((line, index) => {
        const change = findDiffChangeAtLine(changes, hunkIndex, index);
        const isChangeStart = Boolean(change && change.startLineIndex === index);

        return (
          <div
            key={`${hunk.header}-${index}`}
            id={isChangeStart ? change?.id : undefined}
            className={isChangeStart ? "scroll-mt-28" : undefined}
          >
            <DiffLine
              line={line}
              inline={inlineByLine[index]}
              isActiveChange={change?.id === activeChangeId}
              onAddComment={onAddComment ? () => onAddComment(line) : undefined}
            />
            {renderAfterLine?.(line)}
          </div>
        );
      })}
    </div>
  );
}
