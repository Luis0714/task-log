import { useMemo, type ReactNode } from "react";

import { DiffHunk } from "@/components/git/diff-hunk";
import type { GitDiffLine, GitFileChange } from "@/lib/git/changeset";
import {
  collectDiffChanges,
  diffChangeElementId,
  type DiffChangeAnchor,
} from "@/lib/git/diff-changes";

export type FileDiffHunksProps = Readonly<{
  file: GitFileChange;
  activeChangeIndex?: number;
  onAddComment?: (line: GitDiffLine) => void;
  renderAfterLine?: (line: GitDiffLine) => ReactNode;
}>;

export function fileDiffChangeAnchors(file: GitFileChange): DiffChangeAnchor[] {
  return collectDiffChanges(file.hunks).map((change, index) => ({
    ...change,
    id: diffChangeElementId(file.path, index),
  }));
}

export function FileDiffHunks({
  file,
  activeChangeIndex = -1,
  onAddComment,
  renderAfterLine,
}: FileDiffHunksProps) {
  const changes = useMemo(
    () => fileDiffChangeAnchors(file),
    [file.hunks, file.path],
  );
  const activeChangeId =
    activeChangeIndex >= 0 ? (changes[activeChangeIndex]?.id ?? null) : null;

  if (file.hunks.length === 0) {
    return (
      <p className="px-3 py-6 text-center text-sm text-muted-foreground">
        Sin diferencias de contenido.
      </p>
    );
  }

  return (
    <>
      {file.hunks.map((hunk, hunkIndex) => (
        <DiffHunk
          key={`${hunk.header}-${hunkIndex}`}
          hunk={hunk}
          hunkIndex={hunkIndex}
          changes={changes}
          activeChangeId={activeChangeId}
          onAddComment={onAddComment}
          renderAfterLine={renderAfterLine}
        />
      ))}
    </>
  );
}
