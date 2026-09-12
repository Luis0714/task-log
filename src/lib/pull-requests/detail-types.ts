import type { GitFileChange } from "@/lib/git/changeset";
import type {
  PullRequestLifecycleStatus,
  PullRequestVoteStatus,
} from "@/lib/pull-requests/types";
import type { LinkableWorkItemKind } from "@/lib/work-items/linkable-work-item";

export const PULL_REQUEST_DETAIL_TABS = [
  "overview",
  "files",
  "conflicts",
] as const;

export type PullRequestDetailTab = (typeof PULL_REQUEST_DETAIL_TABS)[number];

export type PullRequestCheckState = "pending" | "succeeded" | "failed";

export type PullRequestDetailCheck = {
  id: string;
  label: string;
  state: PullRequestCheckState;
};

export type PullRequestDetailReviewer = {
  id: string;
  displayName: string;
  isRequired: boolean;
  vote: number;
};

export type PullRequestDetailWorkItem = {
  id: number;
  title: string;
  type: string;
  kind: LinkableWorkItemKind;
  state: string;
};

export type PullRequestDetailCompare = {
  source: string;
  target: string;
};

export type PullRequestMutation =
  | { action: "vote"; vote: number }
  | { action: "abandon" }
  | { action: "reactivate" }
  | { action: "cancelAutoComplete" };

export type PullRequestDetail = {
  id: number;
  title: string;
  description: string;
  lifecycleStatus: PullRequestLifecycleStatus;
  voteStatus: PullRequestVoteStatus;
  approvalSummary: string | null;
  sourceBranch: string;
  targetBranch: string;
  repository: string;
  project: string;
  author: string;
  createdAt: string;
  closedAt: string | null;
  closedBy: string | null;
  autoCompleteSetBy: string | null;
  hasConflicts: boolean;
  isDraft: boolean;
  isMine: boolean;
  needsMyReview: boolean;
  myVote: number;
  mergeCommitId: string | null;
  mergeCommitAuthor: string | null;
  mergeCommitDate: string | null;
  compare: PullRequestDetailCompare;
  reviewers: readonly PullRequestDetailReviewer[];
  labels: readonly string[];
  workItems: readonly PullRequestDetailWorkItem[];
  checks: readonly PullRequestDetailCheck[];
  conflictedFiles: readonly string[];
  files: readonly GitFileChange[];
};
