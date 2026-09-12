import type { GitDiffLine } from "@/lib/git/changeset";
import { lcsIndexPairs } from "@/lib/git/lcs-pairs";

export type InlineDiffSegment = {
  text: string;
  changed: boolean;
};

const MAX_INLINE_TOKENS = 250;
const WHOLE_LINE_RATIO = 0.85;

function tokenize(text: string): string[] {
  return text.match(/\s+|\w+|[^\s\w]+/g) ?? (text ? [text] : []);
}

function segmentsFromTokens(
  tokens: readonly string[],
  matchedIndexes: ReadonlySet<number>,
): InlineDiffSegment[] {
  const segments: InlineDiffSegment[] = [];

  for (const [index, token] of tokens.entries()) {
    const changed = !matchedIndexes.has(index);
    const last = segments.at(-1);
    if (last && last.changed === changed) {
      last.text += token;
      continue;
    }
    segments.push({ text: token, changed });
  }

  return segments;
}

function changedRatio(segments: readonly InlineDiffSegment[]): number {
  const total = segments.reduce((sum, segment) => sum + segment.text.length, 0);
  if (total === 0) return 1;
  const changed = segments.reduce(
    (sum, segment) => sum + (segment.changed ? segment.text.length : 0),
    0,
  );
  return changed / total;
}

export function inlineDiff(
  before: string,
  after: string,
): { before: InlineDiffSegment[]; after: InlineDiffSegment[] } | null {
  if (before === after) return null;

  const beforeTokens = tokenize(before);
  const afterTokens = tokenize(after);
  if (
    beforeTokens.length === 0 ||
    afterTokens.length === 0 ||
    beforeTokens.length > MAX_INLINE_TOKENS ||
    afterTokens.length > MAX_INLINE_TOKENS
  ) {
    return null;
  }

  const pairs = lcsIndexPairs(beforeTokens, afterTokens);
  if (pairs.length === 0) return null;

  const beforeMatched = new Set(pairs.map(([left]) => left));
  const afterMatched = new Set(pairs.map(([, right]) => right));
  const beforeSegments = segmentsFromTokens(beforeTokens, beforeMatched);
  const afterSegments = segmentsFromTokens(afterTokens, afterMatched);

  if (
    changedRatio(beforeSegments) >= WHOLE_LINE_RATIO &&
    changedRatio(afterSegments) >= WHOLE_LINE_RATIO
  ) {
    return null;
  }

  if (
    !beforeSegments.some((segment) => segment.changed) &&
    !afterSegments.some((segment) => segment.changed)
  ) {
    return null;
  }

  return { before: beforeSegments, after: afterSegments };
}

export function inlineDiffsForLines(
  lines: readonly GitDiffLine[],
): Array<InlineDiffSegment[] | null> {
  const result: Array<InlineDiffSegment[] | null> = Array.from(
    { length: lines.length },
    () => null,
  );

  let index = 0;
  while (index < lines.length) {
    if (lines[index]?.type === "context") {
      index += 1;
      continue;
    }

    const start = index;
    while (index < lines.length && lines[index]?.type !== "context") {
      index += 1;
    }

    const deletionIndexes: number[] = [];
    const additionIndexes: number[] = [];
    for (let cursor = start; cursor < index; cursor += 1) {
      const type = lines[cursor]?.type;
      if (type === "deletion") deletionIndexes.push(cursor);
      if (type === "addition") additionIndexes.push(cursor);
    }

    const paired = Math.min(deletionIndexes.length, additionIndexes.length);
    for (let pairIndex = 0; pairIndex < paired; pairIndex += 1) {
      const deletionIndex = deletionIndexes[pairIndex];
      const additionIndex = additionIndexes[pairIndex];
      const deletion = lines[deletionIndex];
      const addition = lines[additionIndex];
      if (!deletion || !addition) continue;
      const diff = inlineDiff(deletion.content, addition.content);
      if (!diff) continue;
      result[deletionIndex] = diff.before;
      result[additionIndex] = diff.after;
    }
  }

  return result;
}
