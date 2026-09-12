export const PULL_REQUEST_VOTE_STATUSES = [
  "needs_review",
  "approved",
  "changes_requested",
  "waiting",
  "draft",
] as const;

export type PullRequestVoteStatus = (typeof PULL_REQUEST_VOTE_STATUSES)[number];

export const PULL_REQUEST_LIFECYCLE_STATUSES = [
  "active",
  "completed",
  "abandoned",
] as const;

export type PullRequestLifecycleStatus =
  (typeof PULL_REQUEST_LIFECYCLE_STATUSES)[number];

export const PULL_REQUEST_TABS = [
  "mine",
  "active",
  "completed",
  "abandoned",
] as const;

export type PullRequestTab = (typeof PULL_REQUEST_TABS)[number];

export type PullRequestListItem = {
  id: number;
  title: string;
  status: PullRequestVoteStatus;
  lifecycleStatus: PullRequestLifecycleStatus;
  approvalSummary: string | null;
  sourceBranch: string;
  targetBranch: string;
  author: string;
  reviewers: readonly string[];
  commentCount: number;
  changedFileCount: number;
  updatedAt: string;
  hasConflicts: boolean;
  isMine: boolean;
  needsMyReview: boolean;
  repository: string;
  project: string;
};

export type PullRequestFilterState = {
  search: string;
  tab: PullRequestTab;
  repository: string;
  createdBy: string;
  assignedTo: string;
};

export const ANY_FILTER_VALUE = "anyone";
export const ME_FILTER_VALUE = "me";
export const ALL_REPOSITORIES_VALUE = "all";
