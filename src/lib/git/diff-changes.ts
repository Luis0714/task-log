import type { GitDiffHunk } from "@/lib/git/changeset";

export type DiffChange = {
  hunkIndex: number;
  startLineIndex: number;
  endLineIndex: number;
};

export type DiffChangeAnchor = DiffChange & {
  id: string;
};

export function collectDiffChanges(hunks: readonly GitDiffHunk[]): DiffChange[] {
  const changes: DiffChange[] = [];

  hunks.forEach((hunk, hunkIndex) => {
    let startLineIndex: number | null = null;

    hunk.lines.forEach((line, lineIndex) => {
      const isChange = line.type !== "context";
      if (isChange) {
        if (startLineIndex === null) startLineIndex = lineIndex;
        return;
      }

      if (startLineIndex !== null) {
        changes.push({
          hunkIndex,
          startLineIndex,
          endLineIndex: lineIndex - 1,
        });
        startLineIndex = null;
      }
    });

    if (startLineIndex !== null) {
      changes.push({
        hunkIndex,
        startLineIndex,
        endLineIndex: hunk.lines.length - 1,
      });
    }
  });

  return changes;
}

export function findDiffChangeAtLine(
  changes: readonly DiffChangeAnchor[],
  hunkIndex: number,
  lineIndex: number,
): DiffChangeAnchor | undefined {
  return changes.find(
    (change) =>
      change.hunkIndex === hunkIndex &&
      lineIndex >= change.startLineIndex &&
      lineIndex <= change.endLineIndex,
  );
}
