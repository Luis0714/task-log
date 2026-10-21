import type {
  PolicyEvaluationSource,
  PolicySignal,
  ReviewCommentSignal,
  ReviewThreadSource,
} from "@/lib/review-times/types";

const VOTE_CONTENT = /voted\s+(-?\d+)/i;

function propertyValue(properties: Record<string, unknown> | undefined, key: string): string | null {
  const raw = properties?.[key];
  if (typeof raw === "string" || typeof raw === "number") return String(raw);
  if (raw && typeof raw === "object" && "$value" in raw) {
    const value = (raw as { $value?: unknown }).$value;
    if (typeof value === "string" || typeof value === "number") return String(value);
  }
  return null;
}

function commentKind(commentType: string | number | undefined): "text" | "system" | "other" {
  const type = String(commentType ?? "").trim().toLowerCase();
  if (type === "" || type === "text" || type === "1") return "text";
  if (type === "system" || type === "3") return "system";
  return "other";
}

function voteFromContent(content: string | undefined): number | null {
  const match = VOTE_CONTENT.exec(content?.trim() ?? "");
  if (!match) return null;
  const vote = Number(match[1]);
  return Number.isFinite(vote) ? vote : null;
}

function namedProperty(properties: Record<string, unknown> | undefined, suffix: string): string | null {
  if (!properties) return null;
  const needle = suffix.toLowerCase();
  for (const [key, value] of Object.entries(properties)) {
    if (!key.toLowerCase().endsWith(needle)) continue;
    const read = propertyValue({ [key]: value }, key);
    if (read != null) return read;
  }
  return null;
}

function threadVote(thread: ReviewThreadSource): number | null {
  const threadType = namedProperty(thread.properties, "CodeReviewThreadType");
  if (threadType !== "VoteUpdate") return null;
  const raw = namedProperty(thread.properties, "CodeReviewVoteResult");
  if (raw == null) return null;
  const vote = Number(raw);
  return Number.isFinite(vote) ? vote : null;
}

function publishedAt(comment: {
  publishedDate?: string;
  lastUpdatedDate?: string;
}): string | null {
  const value = comment.publishedDate?.trim() || comment.lastUpdatedDate?.trim() || "";
  if (!value || !Number.isFinite(Date.parse(value))) return null;
  return value;
}

export function mapThreadSignals(threads: readonly ReviewThreadSource[]): ReviewCommentSignal[] {
  const signals: ReviewCommentSignal[] = [];

  for (const thread of threads) {
    if (thread.isDeleted) continue;
    const propertyVote = threadVote(thread);

    for (const comment of thread.comments ?? []) {
      if (comment.isDeleted) continue;
      const authorId = comment.author?.id?.trim() || comment.author?.uniqueName?.trim();
      const authorName = comment.author?.displayName?.trim() || "";
      const at = publishedAt(comment);
      if (!authorId || !at) continue;

      const contentVote = voteFromContent(comment.content);
      const kind = commentKind(comment.commentType);
      const vote = propertyVote ?? contentVote;
      if (vote != null && (kind === "system" || contentVote != null)) {
        signals.push({ authorId, authorName, publishedAt: at, kind: "vote", vote });
        continue;
      }
      if (kind === "text") {
        signals.push({ authorId, authorName, publishedAt: at, kind: "text", vote: null });
      }
    }
  }

  return signals;
}

export function mapPolicySignals(
  policies: readonly PolicyEvaluationSource[],
): PolicySignal[] {
  return policies.flatMap((policy) => {
    const typeId = policy.configuration?.type?.id?.trim() ?? "";
    if (!typeId) return [];
    return [
      {
        typeId,
        isEnabled: policy.configuration?.isEnabled !== false,
        isBlocking: policy.configuration?.isBlocking === true,
        status: policy.status?.trim() ?? "",
        completedAt: policy.completedDate?.trim() || null,
      },
    ];
  });
}
