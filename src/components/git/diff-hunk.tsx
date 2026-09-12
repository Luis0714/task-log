import { DiffLine } from "@/components/git/diff-line";
import type { GitDiffHunk } from "@/lib/git/changeset";

export type DiffHunkProps = {
  hunk: GitDiffHunk;
};

export function DiffHunk({ hunk }: DiffHunkProps) {
  return (
    <div className="min-w-0">
      <p className="bg-muted/80 px-2 py-1 font-mono text-[11px] text-muted-foreground">
        {hunk.header}
      </p>
      {hunk.lines.map((line, index) => (
        <DiffLine key={`${hunk.header}-${index}`} line={line} />
      ))}
    </div>
  );
}
