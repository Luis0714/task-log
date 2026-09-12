export const PULL_REQUEST_THREAD_STATUSES = [
  "active",
  "pending",
  "fixed",
  "wontFix",
  "closed",
  "byDesign",
] as const;

export type PullRequestThreadStatus = (typeof PULL_REQUEST_THREAD_STATUSES)[number];

export type PullRequestThreadLineSide = "left" | "right";

export type PullRequestThreadComment = {
  id: number;
  author: string;
  content: string;
  createdAt: string;
};

export type PullRequestThread = {
  id: number;
  status: PullRequestThreadStatus;
  filePath: string | null;
  line: number | null;
  lineSide: PullRequestThreadLineSide | null;
  comments: readonly PullRequestThreadComment[];
};

export type CreatePullRequestThreadInput = {
  content: string;
  filePath?: string;
  line?: number;
  lineSide?: PullRequestThreadLineSide;
};
