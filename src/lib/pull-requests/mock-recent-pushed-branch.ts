export type RecentPushedBranch = {
  repository: string;
  sourceBranch: string;
  targetBranch: string;
};

export const MOCK_RECENT_PUSHED_BRANCH: RecentPushedBranch = {
  repository: "STUDIA-LMS-WEB",
  sourceBranch: "feat/HU175",
  targetBranch: "main",
};

export const RECENT_PUSH_DISMISS_STORAGE_KEY =
  "task-log.recent-pushed-branch.dismissed";

export function recentPushDismissId(suggestion: RecentPushedBranch): string {
  return `${suggestion.repository}:${suggestion.sourceBranch}`;
}
