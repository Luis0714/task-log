import type { GitDiffLine } from "@/lib/git/changeset";
import type { PullRequestThread } from "@/lib/pull-requests/thread-types";

export function normalizeThreadFilePath(path: string): string {
  return path.replace(/^\/+/, "").trim();
}

export function toAdoThreadFilePath(path: string): string {
  const normalized = normalizeThreadFilePath(path);
  return normalized ? `/${normalized}` : "";
}

export function diffLineCommentKey(filePath: string, line: GitDiffLine): string | null {
  const path = normalizeThreadFilePath(filePath);
  if (!path) return null;
  if (line.type === "deletion" && line.oldNumber) {
    return `${path}:left:${line.oldNumber}`;
  }
  if (line.newNumber) return `${path}:right:${line.newNumber}`;
  if (line.oldNumber) return `${path}:left:${line.oldNumber}`;
  return null;
}

export function threadCommentKey(thread: PullRequestThread): string | null {
  if (!thread.filePath || !thread.line || !thread.lineSide) return null;
  return `${normalizeThreadFilePath(thread.filePath)}:${thread.lineSide}:${thread.line}`;
}

export function canCommentOnDiffLine(line: GitDiffLine): boolean {
  return Boolean(line.oldNumber || line.newNumber);
}

export function lineAnchorFromDiffLine(
  line: GitDiffLine,
): { line: number; lineSide: "left" | "right" } | null {
  if (line.type === "deletion" && line.oldNumber) {
    return { line: line.oldNumber, lineSide: "left" };
  }
  if (line.newNumber) return { line: line.newNumber, lineSide: "right" };
  if (line.oldNumber) return { line: line.oldNumber, lineSide: "left" };
  return null;
}
