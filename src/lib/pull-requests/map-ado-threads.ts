import type {
  AdoPullRequestThread,
  AdoPullRequestThreadComment,
  AdoPullRequestThreadContext,
} from "@/lib/azure-devops/pull-request-threads";
import { normalizeThreadFilePath } from "@/lib/pull-requests/thread-line-key";
import { mapPullRequestThreadStatus } from "@/lib/pull-requests/thread-status";
import type {
  PullRequestThread,
  PullRequestThreadComment,
  PullRequestThreadLineSide,
} from "@/lib/pull-requests/thread-types";

function isUserComment(comment: AdoPullRequestThreadComment): boolean {
  if (comment.isDeleted) return false;
  const type = String(comment.commentType ?? "").toLowerCase();
  return type === "" || type === "text" || type === "1";
}

function mapComment(
  comment: AdoPullRequestThreadComment,
): PullRequestThreadComment | null {
  const id = comment.id;
  const content = comment.content?.trim();
  if (!id || !content || !isUserComment(comment)) return null;
  return {
    id,
    author: comment.author?.displayName?.trim() || "Desconocido",
    content,
    createdAt: comment.publishedDate || comment.lastUpdatedDate || new Date().toISOString(),
  };
}

function mapLineAnchor(context: AdoPullRequestThreadContext | null | undefined): {
  filePath: string | null;
  line: number | null;
  lineSide: PullRequestThreadLineSide | null;
} {
  const filePath = context?.filePath?.trim()
    ? normalizeThreadFilePath(context.filePath)
    : null;
  const right = context?.rightFileStart?.line;
  if (right && right > 0) {
    return { filePath, line: right, lineSide: "right" };
  }
  const left = context?.leftFileStart?.line;
  if (left && left > 0) {
    return { filePath, line: left, lineSide: "left" };
  }
  return { filePath, line: null, lineSide: null };
}

export function mapAdoPullRequestThread(
  thread: AdoPullRequestThread,
): PullRequestThread | null {
  const id = thread.id;
  if (!id || thread.isDeleted) return null;

  const comments = (thread.comments ?? [])
    .map(mapComment)
    .filter((comment): comment is PullRequestThreadComment => comment !== null);
  if (comments.length === 0) return null;

  return {
    id,
    status: mapPullRequestThreadStatus(thread.status),
    comments,
    ...mapLineAnchor(thread.threadContext),
  };
}

export function mapAdoPullRequestThreads(
  threads: readonly AdoPullRequestThread[],
): PullRequestThread[] {
  return threads
    .map(mapAdoPullRequestThread)
    .filter((thread): thread is PullRequestThread => thread !== null)
    .sort((left, right) => {
      const leftDate = left.comments[0]?.createdAt ?? "";
      const rightDate = right.comments[0]?.createdAt ?? "";
      return leftDate.localeCompare(rightDate);
    });
}
