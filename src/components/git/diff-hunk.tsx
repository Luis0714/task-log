import type { ReactNode } from "react";

import { DiffLine } from "@/components/git/diff-line";
import type { GitDiffHunk, GitDiffLine } from "@/lib/git/changeset";

export type DiffHunkProps = Readonly<{
  hunk: GitDiffHunk;
  onAddComment?: (line: GitDiffLine) => void;
  renderAfterLine?: (line: GitDiffLine) => ReactNode;
}>;

export function DiffHunk({ hunk, onAddComment, renderAfterLine }: DiffHunkProps) {
  return (
    <div className="min-w-0">
      <p className="bg-muted/80 px-2 py-1 font-mono text-[11px] text-muted-foreground">
        {hunk.header}
      </p>
      {hunk.lines.map((line, index) => (
        <div key={`${hunk.header}-${index}`}>
          <DiffLine
            line={line}
            onAddComment={onAddComment ? () => onAddComment(line) : undefined}
          />
          {renderAfterLine?.(line)}
        </div>
      ))}
    </div>
  );
}
