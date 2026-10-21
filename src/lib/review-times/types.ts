export const REVIEW_TIME_STATUSES = [
  "pending_review",
  "reviewed",
  "approved",
] as const;

export type ReviewTimeStatus = (typeof REVIEW_TIME_STATUSES)[number];

export const READY_STATES = ["none", "pending", "ready"] as const;

export type ReadyState = (typeof READY_STATES)[number];

export type ReviewTimeReviewer = {
  id: string;
  displayName: string;
  isRequired: boolean;
};

export type ReviewTimePullRequest = {
  id: number;
  title: string;
  repository: string;
  authorId: string;
  authorName: string;
  createdAt: string;
  isDraft: boolean;
  isCompleted: boolean;
  reviewers: readonly ReviewTimeReviewer[];
};

export type ReviewCommentSignal = {
  authorId: string;
  authorName?: string;
  publishedAt: string;
  kind: "text" | "vote";
  vote: number | null;
};

export type PolicySignal = {
  typeId: string;
  isEnabled: boolean;
  isBlocking: boolean;
  status: string;
  completedAt: string | null;
};

export type ReviewTimeRow = {
  pullRequestId: number;
  title: string;
  repository: string;
  authorId: string;
  authorName: string;
  reviewerId: string | null;
  reviewerName: string;
  createdAt: string;
  reviewedAt: string | null;
  approvedAt: string | null;
  readyAt: string | null;
  readyState: ReadyState;
  isDraft: boolean;
  isCompleted: boolean;
  status: ReviewTimeStatus;
};

export type ReviewTimeAverages = {
  reviewMs: number | null;
  reviewCount: number;
  approvalMs: number | null;
  approvalCount: number;
};

export type ReviewTimeLocalFilters = {
  reviewerIds: readonly string[];
  authorIds: readonly string[];
  statuses: readonly ReviewTimeStatus[];
  search: string;
};

export type ReviewThreadSource = {
  isDeleted?: boolean;
  properties?: Record<string, unknown>;
  comments?: Array<{
    isDeleted?: boolean;
    commentType?: string | number;
    publishedDate?: string;
    lastUpdatedDate?: string;
    content?: string;
    author?: { id?: string; displayName?: string; uniqueName?: string };
  }>;
};

export type PolicyEvaluationSource = {
  status?: string;
  completedDate?: string;
  configuration?: {
    isEnabled?: boolean;
    isBlocking?: boolean;
    type?: { id?: string };
  };
};
