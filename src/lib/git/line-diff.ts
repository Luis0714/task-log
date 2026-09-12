import type { GitDiffHunk, GitDiffLine } from "@/lib/git/changeset";
import { lcsIndexPairs } from "@/lib/git/lcs-pairs";

const CONTEXT_LINES = 3;
const MAX_LCS_LINES = 600;

function splitLines(text: string): string[] {
  if (!text) return [];
  return text.replaceAll("\r\n", "\n").replaceAll("\r", "\n").split("\n");
}

function collectLines(before: string[], after: string[]): GitDiffLine[] {
  if (before.length > MAX_LCS_LINES || after.length > MAX_LCS_LINES) {
    return [
      ...before.slice(0, MAX_LCS_LINES).map((content, index) => ({
        type: "deletion" as const,
        oldNumber: index + 1,
        content,
      })),
      ...after.slice(0, MAX_LCS_LINES).map((content, index) => ({
        type: "addition" as const,
        newNumber: index + 1,
        content,
      })),
    ];
  }

  const pairs = lcsIndexPairs(before, after);
  const lines: GitDiffLine[] = [];
  let beforeIndex = 0;
  let afterIndex = 0;

  for (const [matchBefore, matchAfter] of pairs) {
    while (beforeIndex < matchBefore) {
      lines.push({
        type: "deletion",
        oldNumber: beforeIndex + 1,
        content: before[beforeIndex] ?? "",
      });
      beforeIndex += 1;
    }
    while (afterIndex < matchAfter) {
      lines.push({
        type: "addition",
        newNumber: afterIndex + 1,
        content: after[afterIndex] ?? "",
      });
      afterIndex += 1;
    }
    lines.push({
      type: "context",
      oldNumber: matchBefore + 1,
      newNumber: matchAfter + 1,
      content: before[matchBefore] ?? "",
    });
    beforeIndex = matchBefore + 1;
    afterIndex = matchAfter + 1;
  }

  while (beforeIndex < before.length) {
    lines.push({
      type: "deletion",
      oldNumber: beforeIndex + 1,
      content: before[beforeIndex] ?? "",
    });
    beforeIndex += 1;
  }
  while (afterIndex < after.length) {
    lines.push({
      type: "addition",
      newNumber: afterIndex + 1,
      content: after[afterIndex] ?? "",
    });
    afterIndex += 1;
  }

  return lines;
}

function toHunks(lines: GitDiffLine[]): GitDiffHunk[] {
  if (lines.length === 0) return [];

  const changeIndexes = lines.flatMap((line, index) =>
    line.type === "context" ? [] : [index],
  );
  if (changeIndexes.length === 0) return [];

  const hunks: GitDiffHunk[] = [];
  let cursor = 0;

  while (cursor < changeIndexes.length) {
    const start = Math.max(0, changeIndexes[cursor] - CONTEXT_LINES);
    let end = Math.min(lines.length - 1, changeIndexes[cursor] + CONTEXT_LINES);
    let lookAhead = cursor + 1;

    while (
      lookAhead < changeIndexes.length &&
      changeIndexes[lookAhead] <= end + CONTEXT_LINES * 2
    ) {
      end = Math.min(lines.length - 1, changeIndexes[lookAhead] + CONTEXT_LINES);
      lookAhead += 1;
    }

    const hunkLines = lines.slice(start, end + 1);
    const firstOld = hunkLines.find((line) => line.oldNumber)?.oldNumber ?? 0;
    const firstNew = hunkLines.find((line) => line.newNumber)?.newNumber ?? 0;
    const oldCount = hunkLines.filter((line) => line.oldNumber !== undefined).length;
    const newCount = hunkLines.filter((line) => line.newNumber !== undefined).length;

    hunks.push({
      header: `@@ -${firstOld},${oldCount} +${firstNew},${newCount} @@`,
      lines: hunkLines,
    });
    cursor = lookAhead;
  }

  return hunks;
}

export function buildLineDiffHunks(before: string, after: string): GitDiffHunk[] {
  return toHunks(collectLines(splitLines(before), splitLines(after)));
}

export function countDiffStats(hunks: readonly GitDiffHunk[]) {
  return hunks.reduce(
    (stats, hunk) => ({
      additions:
        stats.additions + hunk.lines.filter((line) => line.type === "addition").length,
      deletions:
        stats.deletions + hunk.lines.filter((line) => line.type === "deletion").length,
    }),
    { additions: 0, deletions: 0 },
  );
}
