import type { GitDiffHunk, GitFileChange } from "@/lib/git/changeset";

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

export type DiffChangeDirection = 1 | -1;

export type DiffChangeStep = {
  filePath: string;
  changeIndex: number;
  landing: "first" | "last" | null;
};

export function fileNavigableChangeCount(
  file: GitFileChange,
  loadedPaths: ReadonlySet<string>,
): number | null {
  if (!loadedPaths.has(file.path)) return null;
  return collectDiffChanges(file.hunks).length;
}

export function estimateGlobalChangePosition(
  files: readonly GitFileChange[],
  loadedPaths: ReadonlySet<string>,
  currentPath: string | null,
  currentChangeIndex: number,
): { current: number; total: number } {
  let total = 0;
  let current = 0;

  for (const file of files) {
    const count = fileNavigableChangeCount(file, loadedPaths);
    const size = count === null ? 1 : count;
    if (file.path === currentPath) {
      current = currentChangeIndex < 0 ? 0 : total + currentChangeIndex + 1;
    }
    total += size;
  }

  return { current, total };
}

export function resolveDiffChangeStep(input: {
  files: readonly GitFileChange[];
  loadedPaths: ReadonlySet<string>;
  currentPath: string | null;
  currentChangeIndex: number;
  direction: DiffChangeDirection;
}): DiffChangeStep | null {
  const { files, loadedPaths, currentPath, currentChangeIndex, direction } = input;
  if (files.length === 0) return null;

  const current = files.find((file) => file.path === currentPath) ?? null;
  const currentCount = current
    ? fileNavigableChangeCount(current, loadedPaths)
    : 0;

  if (current && currentCount !== null && currentCount > 0) {
    if (currentChangeIndex < 0) {
      return {
        filePath: current.path,
        changeIndex: direction === 1 ? 0 : currentCount - 1,
        landing: null,
      };
    }
    const nextIndex = currentChangeIndex + direction;
    if (nextIndex >= 0 && nextIndex < currentCount) {
      return { filePath: current.path, changeIndex: nextIndex, landing: null };
    }
  }

  if (current && currentCount === null && currentChangeIndex < 0) {
    return {
      filePath: current.path,
      changeIndex: 0,
      landing: direction === 1 ? "first" : "last",
    };
  }

  const nextFile = stepChangedFile(files, loadedPaths, currentPath, direction);
  if (!nextFile) return null;

  const nextCount = fileNavigableChangeCount(nextFile, loadedPaths);
  if (nextCount === null) {
    return {
      filePath: nextFile.path,
      changeIndex: 0,
      landing: direction === 1 ? "first" : "last",
    };
  }

  return {
    filePath: nextFile.path,
    changeIndex: direction === 1 ? 0 : nextCount - 1,
    landing: null,
  };
}

function stepChangedFile(
  files: readonly GitFileChange[],
  loadedPaths: ReadonlySet<string>,
  fromPath: string | null,
  direction: DiffChangeDirection,
): GitFileChange | null {
  const start = fromPath
    ? files.findIndex((file) => file.path === fromPath)
    : -1;

  for (let offset = 1; offset <= files.length; offset += 1) {
    const index =
      start < 0
        ? direction === 1
          ? offset - 1
          : files.length - offset
        : (start + direction * offset + files.length) % files.length;
    const file = files[index];
    if (!file) continue;
    const count = fileNavigableChangeCount(file, loadedPaths);
    if (count === 0) continue;
    return file;
  }

  return null;
}

export function diffChangeElementId(filePath: string, changeIndex: number): string {
  return `diff-change-${encodeURIComponent(filePath)}-${changeIndex}`;
}

export function changesetFileElementId(filePath: string): string {
  return `changeset-file-${encodeURIComponent(filePath)}`;
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
