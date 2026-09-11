export const PULL_REQUEST_STATUSES = [
  "needs_review",
  "approved",
  "changes_requested",
  "waiting",
  "draft",
] as const;

export type PullRequestStatus = (typeof PULL_REQUEST_STATUSES)[number];

export const PULL_REQUEST_TABS = ["all", "mine", "to_review", "pending"] as const;

export type PullRequestTab = (typeof PULL_REQUEST_TABS)[number];

export const PULL_REQUEST_FILTER_STATUSES = [
  "all",
  "active",
  "approved",
  "changes_requested",
  "draft",
] as const;

export type PullRequestFilterStatus =
  (typeof PULL_REQUEST_FILTER_STATUSES)[number];

export type PullRequestListItem = {
  id: number;
  title: string;
  status: PullRequestStatus;
  approvalSummary: string | null;
  sourceBranch: string;
  targetBranch: string;
  author: string;
  commentCount: number;
  changedFileCount: number;
  updatedAt: string;
  isMine: boolean;
  needsMyReview: boolean;
  isPending: boolean;
  repository: string;
  project: string;
};

export type PullRequestFilterState = {
  search: string;
  tab: PullRequestTab;
  projects: string[];
  repositories: string[];
  prStatus: PullRequestFilterStatus;
  author: string;
  reviewer: string;
};

export const ANY_FILTER_VALUE = "anyone";
export const ME_FILTER_VALUE = "me";

export function isPullRequestFilterStatus(
  value: string,
): value is PullRequestFilterStatus {
  return (PULL_REQUEST_FILTER_STATUSES as readonly string[]).includes(value);
}
